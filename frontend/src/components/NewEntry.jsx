import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { uploadImage } from '../api/api';
import { auth } from '../firebase';

// Base URL of the API server, used to resolve "/uploads/.." paths
// returned by the upload route into full <img src> URLs.
const ASSET_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/api\/?$/, '');

function resolveAssetUrl(url) {
  if (!url) return url;
  return url.startsWith('http') ? url : `${ASSET_BASE_URL}${url}`;
}

function generateId() {
  return `stk_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function todayISODate() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export default function NewEntry() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [entryDate, setEntryDate] = useState(todayISODate());
  const [content, setContent] = useState("");

  // Stickers: { stickerId, imageUrl, x, y, width, rotation, zIndex }
  // x / y are percentages of the page container's width/height so the
  // "fixed position on page" stays correct at any screen size.

  const [stickers, setStickers] = useState([]);
  const [selectedStickerId, setSelectedStickerId] = useState(null);
  const [pastStickers, setPastStickers] = useState([]);
  const [showStickerPanel, setShowStickerPanel] = useState(false);
  const [insertMode, setInsertMode] = useState('inline'); // 'inline' or 'behind'
  const contentRef = useRef(null);
  const [selectedInlineImage, setSelectedInlineImage] = useState(null);

  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== content) {
      contentRef.current.innerHTML = content;
    }
  }, [content]);

  // "Pic of the day"
  const [picOfDay, setPicOfDay] = useState({ imageUrl: null, enabled: false });
  const [picUploading, setPicUploading] = useState(false);

  //pdf scanning
  const [pdfScanning, setPdfScanning] = useState(false);

  const [stickerUploading, setStickerUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Refs for drag handling
  const pageRef = useRef(null); // the bounding box stickers are positioned within
  const dragState = useRef(null); // { stickerId, offsetXPercent, offsetYPercent }

  // ---------------------------------------------------------------
  // PDF Scanner Handler
  // ---------------------------------------------------------------
  const handlePdfScan = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfScanning(true);
    setErrorMsg("");
    setSuccessMsg("");

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      // Send PDF to your Node.js backend route
      const res = await api.post("/upload-pdf", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Inject the text received from the Python pipeline right into the state
      setContent(res.data.extractedText);
      setSuccessMsg("PDF parsed successfully! Text injected below.");
    } catch (err) {
      console.error(err);
      setErrorMsg(
        err.response?.data?.error || "Failed to parse the PDF document.",
      );
    } finally {
      setPdfScanning(false);
    }
  }, []);

  // ---------------------------------------------------------------
  // Pic of the day
  // ---------------------------------------------------------------
  const handlePicOfDayChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPicUploading(true);
    setErrorMsg("");
    try {
      const imageUrl = await uploadImage(file);
      setPicOfDay({ imageUrl, enabled: true });
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to upload pic of the day.");
    } finally {
      setPicUploading(false);
    }
  }, []);

  // ---------------------------------------------------------------
  // Stickers
  // ---------------------------------------------------------------
  const handleStickerUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStickerUploading(true);
    setErrorMsg("");
    try {
      const imageUrl = await uploadImage(file);
      const sticker = {
        stickerId: generateId(),
        imageUrl,
        x: 50,
        y: 50,
        width: 120,
        rotation: 0,
        zIndex: 10,
      };
      setStickers((prev) => [...prev, sticker]);
      setSelectedStickerId(sticker.stickerId);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to upload sticker.");
    } finally {
      setStickerUploading(false);
    }
  }, []);

  // Load user's saved stickers for the sidebar
  const loadPastStickers = useCallback(async () => {
    try {
      const res = await api.get('/stickers');
      setPastStickers(res.data.stickers || []);
    } catch (err) {
      console.error('Failed to load past stickers', err);
    }
  }, []);

  useEffect(() => { loadPastStickers(); }, [loadPastStickers]);

  // Insert an image node at the current caret position inside the contenteditable
  const insertImageAtCaret = async (imageUrl, width = 120) => {
    const sel = document.getSelection();
    if (!sel || !sel.rangeCount) {
      // append at end
      contentRef.current && contentRef.current.focus();
    }
    const range = sel ? sel.getRangeAt(0) : null;
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.width = `${width}px`;
    img.style.maxWidth = '100%';
    img.className = 'inline-sticker';
    img.dataset.stickerId = generateId();
    img.addEventListener('click', (ev) => {
      ev.stopPropagation();
      setSelectedInlineImage(img.dataset.stickerId);
      // mark this image with a data-id so we can find it later
    });
    if (range) {
      range.deleteContents();
      range.insertNode(img);
      // move caret after image
      range.setStartAfter(img);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } else if (contentRef.current) {
      contentRef.current.appendChild(img);
    }
    // update controlled state
    setContent(contentRef.current ? contentRef.current.innerHTML : '');
  };

  const handlePaste = async (e) => {
    if (!e.clipboardData) return;
    const items = Array.from(e.clipboardData.items || []);
    const imageItem = items.find((it) => it.type && it.type.startsWith('image'));
    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (!file) return;
      try {
        const imageUrl = await uploadImage(file);
        if (insertMode === 'inline') {
          await insertImageAtCaret(resolveAssetUrl(imageUrl));
        } else {
          // behind: add to stickers array as a positioned background element
          const sticker = {
            stickerId: generateId(),
            imageUrl,
            x: 50,
            y: 50,
            width: 200,
            rotation: 0,
            zIndex: 5,
            behind: true,
          };
          setStickers((prev) => [...prev, sticker]);
        }
      } catch (err) {
        console.error('Paste upload failed', err);
      }
    }
  };

  // Click from sidebar to insert sticker
  const handleSidebarInsert = async (sticker) => {
    if (insertMode === 'inline') {
      await insertImageAtCaret(resolveAssetUrl(sticker.imageUrl));
    } else {
      const newSticker = {
        stickerId: generateId(),
        imageUrl: sticker.imageUrl,
        x: 50,
        y: 50,
        width: 200,
        rotation: 0,
        zIndex: 5,
        behind: true,
      };
      setStickers((prev) => [...prev, newSticker]);
    }
  };

  const handleDeleteSticker = useCallback(
    (stickerId) => {
      setStickers((prev) => prev.filter((s) => s.stickerId !== stickerId));
      if (selectedStickerId === stickerId) setSelectedStickerId(null);
    },
    [selectedStickerId],
  );

  // Drag handlers for stickers
  const handleMouseDown = (e, stickerId) => {
    if (!pageRef.current) return;

    const rect = pageRef.current.getBoundingClientRect();
    const sticker = stickers.find((s) => s.stickerId === stickerId);
    if (!sticker) return;

    const mouseXPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const mouseYPercent = ((e.clientY - rect.top) / rect.height) * 100;
    const offsetXPercent = mouseXPercent - sticker.x;
    const offsetYPercent = mouseYPercent - sticker.y;

    dragState.current = { stickerId, mode: 'move', offsetXPercent, offsetYPercent };
    setSelectedStickerId(stickerId);
  };

  const handleResizeMouseDown = (e, stickerId) => {
    e.stopPropagation();
    if (!pageRef.current) return;
    const rect = pageRef.current.getBoundingClientRect();
    const sticker = stickers.find((s) => s.stickerId === stickerId);
    if (!sticker) return;
    dragState.current = {
      stickerId,
      mode: 'resize',
      startClientX: e.clientX,
      startClientY: e.clientY,
      startWidth: sticker.width,
    };
    setSelectedStickerId(stickerId);
  };

  const handleMouseMove = (e) => {
    if (!dragState.current || !pageRef.current) return;

    const rect = pageRef.current.getBoundingClientRect();
    const ds = dragState.current;
    if (ds.mode === 'move') {
      const { stickerId, offsetXPercent, offsetYPercent } = ds;

      const newXPercent = Math.max(
        0,
        Math.min(
          100,
          ((e.clientX - rect.left) / rect.width) * 100 - offsetXPercent,
        ),
      );
      const newYPercent = Math.max(
        0,
        Math.min(
          100,
          ((e.clientY - rect.top) / rect.height) * 100 - offsetYPercent,
        ),
      );

      setStickers((prev) =>
        prev.map((s) =>
          s.stickerId === stickerId
            ? { ...s, x: newXPercent, y: newYPercent }
            : s,
        ),
      );
    } else if (ds.mode === 'resize') {
      const { stickerId, startClientX, startWidth } = ds;
      const deltaX = e.clientX - startClientX;
      setStickers((prev) =>
        prev.map((s) =>
          s.stickerId === stickerId
            ? { ...s, width: Math.max(20, Math.round(startWidth + deltaX)) }
            : s,
        ),
      );
    }
  };

  const handleMouseUp = () => {
    dragState.current = null;
  };

  // ---------------------------------------------------------------
  // Save entry
  // ---------------------------------------------------------------
  const handleSave = useCallback(
    async (e) => {
      e.preventDefault();
      if (!title.trim() || !content.trim()) {
        setErrorMsg("Title and content are required.");
        return;
      }

      setSaving(true);
      setErrorMsg("");
      setSuccessMsg("");

      if (!auth.currentUser) {
        setErrorMsg("You must be signed in to save an entry.");
        setSaving(false);
        return;
      }

      try {
        const payload = {
          mood,
          activity,
          messageToSelf,
          title: title.trim(),
          content,
          excerpt: content
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 180),
          entryDate,
          stickers,
          picOfTheDay: picOfDay,
        };

        const res = await api.post("/entries", payload);
        setSuccessMsg("Entry saved successfully!");

        // Redirect to the new entry after a short delay
        setTimeout(() => {
          navigate(`/entry/${res.data.entryId}`);
        }, 500);
      } catch (err) {
        console.error(err);
        setErrorMsg(err.response?.data?.message || "Failed to save entry.");
      } finally {
        setSaving(false);
      }
    },
    [title, content, entryDate, stickers, picOfDay, navigate],
  );
  const [mood, setMood] = useState("");
  const [activity, setActivity] = useState("");
  const [messageToSelf, setMessageToSelf] = useState("");

  return (
    <main className="container mx-auto mt-8 p-6 rounded-[40px] shadow-2xl relative overflow-hidden" style={{ background: 'rgba(17, 28, 50, 0.96)', border: '1px solid var(--border)' }}>
      {/* Scrapbook Header */}
<div className="relative text-center py-8">

  <div className="absolute left-10 top-0 text-2xl">☁</div>
  <div className="absolute left-32 top-4 text-xl">✦</div>

  <div className="absolute right-10 top-0 text-2xl">♡</div>
  <div className="absolute right-28 top-5 text-xl">☾</div>

  <h2 className="text-2xl font-black tracking-widest">
    New Entry
  </h2>

</div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border rounded"
            placeholder="Entry title"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text)', borderColor: 'var(--border)' }}
          />
        </div>

        {/* Entry Date */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Date</label>
          <input
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="w-full px-4 py-2 border rounded"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text)', borderColor: 'var(--border)' }}
          />
        </div>

        {/* NEW: PDF Document Scanning Component */}
        <div className="p-4 rounded-md" style={{ background: 'rgba(111,141,255,0.14)', border: '1px solid rgba(111,141,255,0.28)' }}>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-h)' }}>
            ✨ Autofill via PDF Scan
          </label>
          <input
            type="file"
            accept="application/pdf"
            onChange={handlePdfScan}
            disabled={pdfScanning}
            className="block text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#3557c7] file:text-white hover:file:bg-[#2947a8] disabled:opacity-50"
            style={{ color: 'var(--text-muted)' }}
          />
          {pdfScanning && (
            <p className="text-xs font-medium mt-2 animate-pulse" style={{ color: 'var(--accent-2)' }}>
              Running Python AI pipeline... reading PDF data...
            </p>
          )}
        </div>

        {/* Content Box (contenteditable for inline images) */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Content</label>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="relative w-full">
                <div className="absolute inset-0 pointer-events-none">
                  {stickers.filter(s=>s.behind).map((st)=>(
                    <img key={st.stickerId} src={resolveAssetUrl(st.imageUrl)} alt="behind" style={{position:'absolute', left:`${st.x}%`, top:`${st.y}%`, width:`${st.width}px`, transform:'translate(-50%,-50%) rotate('+st.rotation+'deg)', zIndex: st.zIndex, opacity:0.9}} />
                  ))}
                </div>
                <div
                  ref={contentRef}
                  onInput={(e) => setContent(e.currentTarget.innerHTML)}
                  onPaste={handlePaste}
                  onClick={() => setSelectedInlineImage(null)}
                  contentEditable
                  dir="ltr"
                  suppressContentEditableWarning
                  className="w-full px-4 py-3 border rounded font-mono text-sm min-h-[240px] bg-transparent relative z-20"
                  style={{direction:'ltr', unicodeBidi:'plaintext'}}
                />
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Paste images (Ctrl/Cmd+V) to insert stickers directly.
              </p>
            </div>
            <div className="w-48">
              <div className="mb-3">
                <label className="block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Stickers</label>
                <button type="button" onClick={() => { setShowStickerPanel((s)=>!s); loadPastStickers(); }} className="mt-2 w-full px-3 py-2 rounded" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text)' }}>Open Stickers</button>
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Insert Mode</label>
                <div className="mt-2 space-x-2">
                  <label className="inline-flex items-center" style={{ color: 'var(--text-muted)' }}><input type="radio" name="insertMode" checked={insertMode==='inline'} onChange={()=>setInsertMode('inline')} /> <span className="ml-2">Inline</span></label>
                  <label className="inline-flex items-center ml-3" style={{ color: 'var(--text-muted)' }}><input type="radio" name="insertMode" checked={insertMode==='behind'} onChange={()=>setInsertMode('behind')} /> <span className="ml-2">Behind text</span></label>
                </div>
              </div>
              {selectedInlineImage && (
                <div className="p-2 border rounded" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.05)' }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Selected Image Controls</p>
                  <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Width</label>
                  <input type="range" min="20" max="800" onChange={(e)=>{
                    const el = contentRef.current.querySelector(`img[data-sticker-id='${selectedInlineImage}']`);
                    if (el){ el.style.width = `${e.target.value}px`; setContent(contentRef.current.innerHTML); }
                  }} />
                  <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Click an inline image to select it and adjust size.</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">

  {/* Left Side */}

  <div className="relative">

    <div className="absolute -top-5 -left-4 rotate-[-20deg] text-3xl">  📸</div>
    <div className="absolute -bottom-4 -left-3 text-3xl">🌼</div>
    <div className="absolute -top-2 right-2 text-3xl">✂️</div>
    <div className="absolute bottom-2 right-2 text-3xl">🖇️</div>

    <div className="rounded-3xl p-4" style={{ border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)' }}>

      {picOfDay.imageUrl ? (
        <img
          src={resolveAssetUrl(picOfDay.imageUrl)}
          alt=""
          className="w-full h-72 object-cover rounded-xl"
        />
      ) : (
        <div className="h-72 flex items-center justify-center border-2 border-dashed rounded-xl" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          Insert Image
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        onChange={handlePicOfDayChange}
        className="mt-4"
      />

    </div>

  </div>

  {/* Right Side */}

  <div className="space-y-5">
    <div className="border-2 border-gray-300 rounded-3xl p-4">

      <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-h)' }}>
        How do I feel today?
      </h3>

      <div className="flex gap-3 flex-wrap">

        <button
          type="button"
          onClick={() => setMood("Good")}
          className={`px-4 py-2 rounded-full border-2 ${
            mood === "Good" ? "text-white" : ""
          }`}
          style={{ borderColor: 'var(--border)', background: mood === 'Good' ? 'var(--accent-strong)' : 'rgba(255,255,255,0.04)', color: mood === 'Good' ? '#fff' : 'var(--text-muted)' }}
        >          😊 Good        </button>

        <button
          type="button"
          onClick={() => setMood("Okay")}
          className={`px-4 py-2 rounded-full border-2 ${
            mood === "Okay" ? "text-white" : ""
          }`}
          style={{ borderColor: 'var(--border)', background: mood === 'Okay' ? 'var(--accent-strong)' : 'rgba(255,255,255,0.04)', color: mood === 'Okay' ? '#fff' : 'var(--text-muted)' }}
        >          🙂 Okay        </button>

        <button
          type="button"
          onClick={() => setMood("Bad")}
          className={`px-4 py-2 rounded-full border-2 ${
            mood === "Bad" ? "text-white" : ""
          }`}
          style={{ borderColor: 'var(--border)', background: mood === 'Bad' ? 'var(--accent-strong)' : 'rgba(255,255,255,0.04)', color: mood === 'Bad' ? '#fff' : 'var(--text-muted)' }}
        >          😔 Bad        </button>

      </div>

    </div>

    <div className="border-2 border-gray-300 rounded-3xl p-4">

      <h3 className="font-semibold mb-2" style={{ color: 'var(--text-h)' }}>
        🎀 Activity of the Day
      </h3>

      <textarea
        value={activity}
        onChange={(e) => setActivity(e.target.value)}
        rows="4"
        className="w-full outline-none rounded"
        style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text)', border: '1px solid var(--border)', padding: '0.75rem' }}
      />

    </div>

  </div>

</div>

        {/* Stickers Section */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Add Stickers</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleStickerUpload}
            disabled={stickerUploading}
            className="px-4 py-2 border rounded"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text)', borderColor: 'var(--border)' }}
          />
          {stickerUploading && (
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Uploading...</p>
          )}
        </div>

        {/* Stickers Canvas */}
        {stickers.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Stickers</h3>
            <div
              ref={pageRef}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="relative w-full rounded p-4"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', minHeight: '300px' }}
              style={{ minHeight: "300px" }}>
              {stickers.map((sticker) => (
                <div
                  key={sticker.stickerId}
                  onMouseDown={(e) => handleMouseDown(e, sticker.stickerId)}
                  onClick={() => setSelectedStickerId(sticker.stickerId)}
                  className={`absolute cursor-move ${selectedStickerId === sticker.stickerId ? "ring-2 ring-blue-500" : ""}`}
                  style={{
                    left: `${sticker.x}%`,
                    top: `${sticker.y}%`,
                    width: `${sticker.width}px`,
                    height: "auto",
                    transform: `translateX(-50%) translateY(-50%) rotate(${sticker.rotation}deg)`,
                    zIndex: sticker.zIndex,
                  }}>
                  <img
                    src={resolveAssetUrl(sticker.imageUrl)}
                    alt="sticker"
                    className="w-full h-auto pointer-events-none"
                  />
                  {/* resize handle */}
                  {selectedStickerId === sticker.stickerId && (
                    <div
                      onMouseDown={(e)=>handleResizeMouseDown(e, sticker.stickerId)}
                      className="absolute bg-white border border-slate-300 rounded-full"
                      style={{width:16,height:16,right:-8,bottom:-8,cursor:'se-resize'}}
                    />
                  )}
                  {selectedStickerId === sticker.stickerId && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSticker(sticker.stickerId)}
                      className="absolute -top-6 -right-6 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center gap-8 text-2xl mt-6 opacity-70">

  <span>☁</span>  <span>✦</span>  <span>♡</span>  <span>☾</span>  <span>✿</span>  <span>♡</span>  <span>✦</span>

</div>

        <button
          type="submit"
          disabled={saving}
          className="w-full px-6 py-3 rounded font-semibold"
          style={{ background: 'var(--accent-strong)', color: '#f9fbff' }}>
          {saving ? "Saving..." : "Save Entry"}
        </button>
        {showStickerPanel && (
          <div className="fixed right-6 top-20 w-80 max-h-[70vh] overflow-auto rounded-lg p-4 shadow-lg z-50" style={{ background: 'rgba(17, 28, 50, 0.98)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Your Stickers</h3>
              <button type="button" onClick={()=>setShowStickerPanel(false)} className="text-sm" style={{ color: 'var(--text-muted)' }}>Close</button>
            </div>
            {pastStickers.length===0 ? (
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>No saved stickers yet.</div>
            ) : (
              <div className="grid gap-3">
                {pastStickers.map((stk)=> (
                  <div key={stk._id} className="flex items-center gap-3">
                    <img src={resolveAssetUrl(stk.imageUrl)} alt="stk" className="w-16 h-16 object-cover rounded" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{stk.label||'Sticker'}</div>
                      <div className="mt-2 flex gap-2">
                        <button type="button" onClick={()=>handleSidebarInsert(stk)} className="px-2 py-1 bg-blue-600 text-white rounded text-xs">Insert</button>
                        <button type="button" onClick={()=>{navigator.clipboard?.writeText(resolveAssetUrl(stk.imageUrl)); setSuccessMsg('Copied URL');}} className="px-2 py-1 bg-slate-100 rounded text-xs">Copy URL</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </form>
    </main>
  );
}
