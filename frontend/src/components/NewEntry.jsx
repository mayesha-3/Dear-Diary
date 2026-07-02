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

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">New Entry</h1>

      {errorMsg && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="bg-green-100 text-green-700 p-4 rounded mb-4">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border rounded"
            placeholder="Entry title"
          />
        </div>

        {/* Entry Date */}
        <div>
          <label className="block text-sm font-medium mb-2">Date</label>
          <input
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="w-full px-4 py-2 border rounded"
          />
        </div>

        {/* NEW: PDF Document Scanning Component */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
          <label className="block text-sm font-semibold text-blue-900 mb-2">
            ✨ Autofill via PDF Scan
          </label>
          <input
            type="file"
            accept="application/pdf"
            onChange={handlePdfScan}
            disabled={pdfScanning}
            className="block text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-900 file:text-white hover:file:bg-blue-800 disabled:opacity-50"
          />
          {pdfScanning && (
            <p className="text-xs font-medium text-blue-700 mt-2 animate-pulse">
              Running Python AI pipeline... reading PDF data...
            </p>
          )}
        </div>

        {/* Content Box (contenteditable for inline images) */}
        <div>
          <label className="block text-sm font-medium mb-2">Content</label>
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
              <p className="text-xs text-gray-500 mt-2">
                Paste images (Ctrl/Cmd+V) to insert stickers directly.
              </p>
            </div>
            <div className="w-48">
              <div className="mb-3">
                <label className="block text-sm font-medium">Stickers</label>
                <button type="button" onClick={() => { setShowStickerPanel((s)=>!s); loadPastStickers(); }} className="mt-2 w-full px-3 py-2 bg-slate-100 rounded">Open Stickers</button>
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium">Insert Mode</label>
                <div className="mt-2 space-x-2">
                  <label className="inline-flex items-center"><input type="radio" name="insertMode" checked={insertMode==='inline'} onChange={()=>setInsertMode('inline')} /> <span className="ml-2">Inline</span></label>
                  <label className="inline-flex items-center ml-3"><input type="radio" name="insertMode" checked={insertMode==='behind'} onChange={()=>setInsertMode('behind')} /> <span className="ml-2">Behind text</span></label>
                </div>
              </div>
              {selectedInlineImage && (
                <div className="p-2 border rounded">
                  <p className="text-sm font-medium">Selected Image Controls</p>
                  <label className="text-xs">Width</label>
                  <input type="range" min="20" max="800" onChange={(e)=>{
                    const el = contentRef.current.querySelector(`img[data-sticker-id='${selectedInlineImage}']`);
                    if (el){ el.style.width = `${e.target.value}px`; setContent(contentRef.current.innerHTML); }
                  }} />
                  <div className="text-xs text-slate-500 mt-2">Click an inline image to select it and adjust size.</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pic of the Day */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Pic of the Day
          </label>
          {picOfDay.imageUrl && (
            <div className="mb-4">
              <img
                src={resolveAssetUrl(picOfDay.imageUrl)}
                alt="Pic of day"
                width={150}
                className="rounded"
              />
              <button
                type="button"
                onClick={() => setPicOfDay({ imageUrl: null, enabled: false })}
                className="mt-2 px-3 py-1 bg-red-500 text-white rounded">
                Remove
              </button>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handlePicOfDayChange}
            disabled={picUploading}
            className="px-4 py-2 border rounded"
          />
          {picUploading && (
            <p className="text-sm text-gray-500 mt-2">Uploading...</p>
          )}
        </div>

        {/* Stickers Section */}
        <div>
          <label className="block text-sm font-medium mb-2">Add Stickers</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleStickerUpload}
            disabled={stickerUploading}
            className="px-4 py-2 border rounded"
          />
          {stickerUploading && (
            <p className="text-sm text-gray-500 mt-2">Uploading...</p>
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
              className="relative w-full bg-gray-50 border-2 border-gray-300 rounded p-4"
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

        <button
          type="submit"
          disabled={saving}
          className="w-full px-6 py-3 bg-gray-900 text-white rounded font-semibold hover:bg-gray-700 disabled:bg-gray-400">
          {saving ? "Saving..." : "Save Entry"}
        </button>
        {showStickerPanel && (
          <div className="fixed right-6 top-20 w-80 max-h-[70vh] overflow-auto bg-white border rounded-lg p-4 shadow-lg z-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Your Stickers</h3>
              <button type="button" onClick={()=>setShowStickerPanel(false)} className="text-sm text-slate-500">Close</button>
            </div>
            {pastStickers.length===0 ? (
              <div className="text-sm text-slate-500">No saved stickers yet.</div>
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