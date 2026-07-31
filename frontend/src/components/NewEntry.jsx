import React, { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { uploadImage } from "../api/api";
import { auth } from "../firebase";

// Base URL of the API server, used to resolve "/uploads/.." paths
// returned by the upload route into full <img src> URLs.
const ASSET_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5001/api"
).replace(/\/api\/?$/, "");

function resolveAssetUrl(url) {
  if (!url) return url;
  return url.startsWith("http") ? url : `${ASSET_BASE_URL}${url}`;
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
  const [mood, setMood] = useState("");
  const [activity, setActivity] = useState("");
  const [messageToSelf, setMessageToSelf] = useState("");

  // Stickers: { stickerId, imageUrl, x, y, width, rotation, zIndex }
  const [stickers, setStickers] = useState([]);
  const [selectedStickerId, setSelectedStickerId] = useState(null);
  const [pastStickers, setPastStickers] = useState([]);
  const [showStickerPanel, setShowStickerPanel] = useState(false);
  const [insertMode, setInsertMode] = useState("inline"); // 'inline' or 'behind'
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

  // PDF scanning
  const [pdfScanning, setPdfScanning] = useState(false);

  const [stickerUploading, setStickerUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Refs for drag handling
  const pageRef = useRef(null);
  const dragState = useRef(null);

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
      const res = await api.post("/upload-pdf", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

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

  const loadPastStickers = useCallback(async () => {
    try {
      const res = await api.get("/stickers");
      setPastStickers(res.data.stickers || []);
    } catch (err) {
      console.error("Failed to load past stickers", err);
    }
  }, []);

  useEffect(() => {
    loadPastStickers();
  }, [loadPastStickers]);

  const insertImageAtCaret = async (imageUrl, width = 120) => {
    const sel = document.getSelection();
    if (!sel || !sel.rangeCount) {
      contentRef.current && contentRef.current.focus();
    }
    const range = sel ? sel.getRangeAt(0) : null;
    const img = document.createElement("img");
    img.src = imageUrl;
    img.style.width = `${width}px`;
    img.style.maxWidth = "100%";
    img.className = "inline-sticker";
    img.dataset.stickerId = generateId();
    img.addEventListener("click", (ev) => {
      ev.stopPropagation();
      setSelectedInlineImage(img.dataset.stickerId);
    });
    if (range) {
      range.deleteContents();
      range.insertNode(img);
      range.setStartAfter(img);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } else if (contentRef.current) {
      contentRef.current.appendChild(img);
    }
    setContent(contentRef.current ? contentRef.current.innerHTML : "");
  };

  const handlePaste = async (e) => {
    if (!e.clipboardData) return;
    const items = Array.from(e.clipboardData.items || []);
    const imageItem = items.find(
      (it) => it.type && it.type.startsWith("image"),
    );
    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (!file) return;
      try {
        const imageUrl = await uploadImage(file);
        if (insertMode === "inline") {
          await insertImageAtCaret(resolveAssetUrl(imageUrl));
        } else {
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
        console.error("Paste upload failed", err);
      }
    }
  };

  const handleSidebarInsert = async (sticker) => {
    if (insertMode === "inline") {
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

  const handleMouseDown = (e, stickerId) => {
    if (!pageRef.current) return;

    const rect = pageRef.current.getBoundingClientRect();
    const sticker = stickers.find((s) => s.stickerId === stickerId);
    if (!sticker) return;

    const mouseXPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const mouseYPercent = ((e.clientY - rect.top) / rect.height) * 100;
    const offsetXPercent = mouseXPercent - sticker.x;
    const offsetYPercent = mouseYPercent - sticker.y;

    dragState.current = {
      stickerId,
      mode: "move",
      offsetXPercent,
      offsetYPercent,
    };
    setSelectedStickerId(stickerId);
  };

  const handleResizeMouseDown = (e, stickerId) => {
    e.stopPropagation();
    if (!pageRef.current) return;
    const sticker = stickers.find((s) => s.stickerId === stickerId);
    if (!sticker) return;
    dragState.current = {
      stickerId,
      mode: "resize",
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
    if (ds.mode === "move") {
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
    } else if (ds.mode === "resize") {
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
    [
      title,
      content,
      entryDate,
      stickers,
      picOfDay,
      mood,
      activity,
      messageToSelf,
      navigate,
    ],
  );

  return (
    <main
      className="container mx-auto mt-8 p-6 rounded-[40px] shadow-2xl relative overflow-hidden transition-colors duration-300"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        color: "var(--text)",
        borderWidth: "1px",
        borderStyle: "solid",
      }}>
      {/* Scrapbook Header */}
      <div className="relative text-center py-8">
        <div className="absolute left-10 top-0 text-2xl">☁</div>
        <div className="absolute left-32 top-4 text-xl">✦</div>

        <div className="absolute right-10 top-0 text-2xl">♡</div>
        <div className="absolute right-28 top-5 text-xl">☾</div>

        <h2
          className="text-2xl font-black tracking-widest"
          style={{ color: "var(--text-h)" }}>
          New Entry
        </h2>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-500 text-sm">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Title */}
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--text-muted)" }}>
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border rounded transition-colors"
            placeholder="Entry title"
            style={{
              background: "var(--surface-2)",
              color: "var(--text)",
              borderColor: "var(--border)",
            }}
          />
        </div>

        {/* Entry Date */}
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--text-muted)" }}>
            Date
          </label>
          <input
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="w-full px-4 py-2 border rounded transition-colors"
            style={{
              background: "var(--surface-2)",
              color: "var(--text)",
              borderColor: "var(--border)",
            }}
          />
        </div>

        {/* PDF Document Scanning Component */}
        <div
          className="p-4 rounded-xl border transition-colors"
          style={{
            background: "var(--accent-soft)",
            borderColor: "var(--border)",
          }}>
          <label
            className="block text-sm font-semibold mb-2"
            style={{ color: "var(--text-h)" }}>
            ✨ Autofill via PDF Scan
          </label>
          <input
            type="file"
            accept="application/pdf"
            onChange={handlePdfScan}
            disabled={pdfScanning}
            className="block text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-800 file:text-white hover:file:bg-gray-700 disabled:opacity-50 cursor-pointer"
            style={{ color: "var(--text-muted)" }}
          />
          {pdfScanning && (
            <p
              className="text-xs font-medium mt-2 animate-pulse"
              style={{ color: "inherit" }}>
              Running Python AI pipeline... reading PDF data...
            </p>
          )}
        </div>

        {/* Content Box (contenteditable for inline images) */}
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--text-muted)" }}>
            Content
          </label>
          <div className="flex flex-col lg:flex-row items-start gap-4">
            <div className="flex-1 w-full">
              <div className="relative w-full">
                <div className="absolute inset-0 pointer-events-none">
                  {stickers
                    .filter((s) => s.behind)
                    .map((st) => (
                      <img
                        key={st.stickerId}
                        src={resolveAssetUrl(st.imageUrl)}
                        alt="behind"
                        style={{
                          position: "absolute",
                          left: `${st.x}%`,
                          top: `${st.y}%`,
                          width: `${st.width}px`,
                          transform:
                            "translate(-50%,-50%) rotate(" +
                            st.rotation +
                            "deg)",
                          zIndex: st.zIndex,
                          opacity: 0.9,
                        }}
                      />
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
                  className="w-full px-4 py-3 border rounded font-mono text-sm min-h-[240px] relative z-20 transition-colors"
                  style={{
                    direction: "ltr",
                    unicodeBidi: "plaintext",
                    background: "var(--surface-2)",
                    color: "var(--text)",
                    borderColor: "var(--border)",
                  }}
                />
              </div>
              <p
                className="text-xs mt-2"
                style={{ color: "var(--text-muted)" }}>
                Paste images (Ctrl/Cmd+V) to insert stickers directly.
              </p>
            </div>
            <div className="w-full lg:w-48">
              <div className="mb-3">
                <label
                  className="block text-sm font-medium"
                  style={{ color: "var(--text-muted)" }}>
                  Stickers
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowStickerPanel((s) => !s);
                    loadPastStickers();
                  }}
                  className="mt-2 w-full px-3 py-2 rounded border transition-colors"
                  style={{
                    background: "var(--surface-3)",
                    color: "var(--text)",
                    borderColor: "var(--border)",
                  }}>
                  Open Stickers
                </button>
              </div>
              <div className="mb-3">
                <label
                  className="block text-sm font-medium"
                  style={{ color: "var(--text-muted)" }}>
                  Insert Mode
                </label>
                <div className="mt-2 space-x-2">
                  <label
                    className="inline-flex items-center cursor-pointer"
                    style={{ color: "var(--text-muted)" }}>
                    <input
                      type="radio"
                      name="insertMode"
                      checked={insertMode === "inline"}
                      onChange={() => setInsertMode("inline")}
                      className="ring-gray-300"
                    />
                    <span className="ml-2">Inline</span>
                  </label>
                  <label
                    className="inline-flex items-center ml-3 cursor-pointer"
                    style={{ color: "var(--text-muted)" }}>
                    <input
                      type="radio"
                      name="insertMode"
                      checked={insertMode === "behind"}
                      onChange={() => setInsertMode("behind")}
                      className="ring-gray-300"
                    />
                    <span className="ml-2">Behind</span>
                  </label>
                </div>
              </div>
              {selectedInlineImage && (
                <div
                  className="p-3 border rounded-xl"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface-3)",
                  }}>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-h)" }}>
                    Selected Image
                  </p>
                  <label
                    className="text-xs mt-2 block"
                    style={{ color: "var(--text-muted)" }}>
                    Width
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="800"
                    onChange={(e) => {
                      const el = contentRef.current.querySelector(
                        `img[data-sticker-id='${selectedInlineImage}']`,
                      );
                      if (el) {
                        el.style.width = `${e.target.value}px`;
                        setContent(contentRef.current.innerHTML);
                      }
                    }}
                    className="w-full ring-gray-300"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Side */}
          <div className="relative">
            <div className="absolute -top-5 -left-4 rotate-[-20deg] text-3xl">
              📸
            </div>
            <div className="absolute -bottom-4 -left-3 text-3xl">🌼</div>
            <div className="absolute -top-2 right-2 text-3xl">✂️</div>
            <div className="absolute bottom-2 right-2 text-3xl">🖇️</div>

            <div
              className="rounded-3xl p-4 border transition-colors"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface-2)",
              }}>
              {picOfDay.imageUrl ? (
                <img
                  src={resolveAssetUrl(picOfDay.imageUrl)}
                  alt=""
                  className="w-full h-72 object-cover rounded-xl"
                />
              ) : (
                <div
                  className="h-72 flex items-center justify-center border-2 border-dashed rounded-xl"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text-muted)",
                  }}>
                  Insert Image
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handlePicOfDayChange}
                disabled={picUploading}
                className="mt-4 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-800 file:text-white hover:file:bg-gray-700 disabled:opacity-50 cursor-pointer"
                style={{ color: "var(--text-muted)" }}
              />
            </div>
          </div>

          {/* Right Side */}
          <div className="space-y-5">
            <div
              className="border rounded-3xl p-4 transition-colors"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface-2)",
              }}>
              <h3
                className="text-xl font-semibold mb-3"
                style={{ color: "var(--text-h)" }}>
                How do I feel today?
              </h3>
              <div className="flex gap-3 flex-wrap">
                {["Good", "Okay", "Bad"].map((m) => {
                  const active = mood === m;
                  const label =
                    m === "Good"
                      ? "😊 Good"
                      : m === "Okay"
                        ? "🙂 Okay"
                        : "😔 Bad";
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMood(m)}
                      className="px-4 py-2 rounded-full border text-sm font-medium transition-colors"
                      style={{
                        borderColor: "var(--border)",
                        background: active ? "#1f2937" : "var(--surface-3)",
                        color: active ? "#ffffff" : "var(--text)",
                      }}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className="border rounded-3xl p-4 transition-colors"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface-2)",
              }}>
              <h3
                className="font-semibold mb-2"
                style={{ color: "var(--text-h)" }}>
                🎀 Activity of the Day
              </h3>
              <textarea
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                rows={4}
                className="w-full outline-none rounded-xl p-3 border text-sm transition-colors"
                style={{
                  background: "var(--surface-3)",
                  color: "var(--text)",
                  borderColor: "var(--border)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Stickers Section */}
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--text-muted)" }}>
            Add Stickers
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleStickerUpload}
            disabled={stickerUploading}
            className="px-4 py-2 border rounded-full text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-gray-800 file:text-white hover:file:bg-gray-700 cursor-pointer"
            style={{
              background: "var(--surface-2)",
              color: "var(--text)",
              borderColor: "var(--border)",
            }}
          />
          {stickerUploading && (
            <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
              Uploading...
            </p>
          )}
        </div>

        {/* Stickers Canvas */}
        {stickers.length > 0 && (
          <div>
            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: "var(--text-h)" }}>
              Stickers Canvas
            </h3>
            <div
              ref={pageRef}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="relative w-full rounded-2xl p-4 transition-colors min-h-[300px]"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
              }}>
              {stickers.map((sticker) => (
                <div
                  key={sticker.stickerId}
                  onMouseDown={(e) => handleMouseDown(e, sticker.stickerId)}
                  onClick={() => setSelectedStickerId(sticker.stickerId)}
                  className={`absolute cursor-move ${selectedStickerId === sticker.stickerId ? "ring-2 ring-gray-300" : ""}`}
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
                  {selectedStickerId === sticker.stickerId && (
                    <div
                      onMouseDown={(e) =>
                        handleResizeMouseDown(e, sticker.stickerId)
                      }
                      className="absolute bg-white border border-slate-400 rounded-full shadow"
                      style={{
                        width: 16,
                        height: 16,
                        right: -8,
                        bottom: -8,
                        cursor: "se-resize",
                      }}
                    />
                  )}
                  {selectedStickerId === sticker.stickerId && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSticker(sticker.stickerId)}
                      className="absolute -top-6 -right-6 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow hover:bg-red-600">
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center gap-8 text-2xl mt-6 opacity-70">
          <span>☁</span> <span>✦</span> <span>♡</span> <span>☾</span>{" "}
          <span>✿</span> <span>♡</span> <span>✦</span>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full px-6 py-3 rounded-full font-semibold shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99]"
          style={{ background: "#1f2937", color: "#ffffff" }}>
          {saving ? "Saving..." : "Save Entry"}
        </button>

        {showStickerPanel && (
          <div
            className="fixed right-6 top-20 w-80 max-h-[70vh] overflow-auto rounded-3xl p-4 shadow-2xl z-50 border transition-colors"
            style={{
              background: "var(--surface-2)",
              borderColor: "var(--border)",
            }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold" style={{ color: "var(--text-h)" }}>
                Your Stickers
              </h3>
              <button
                type="button"
                onClick={() => setShowStickerPanel(false)}
                className="text-sm hover:underline"
                style={{ color: "var(--text-muted)" }}>
                Close
              </button>
            </div>
            {pastStickers.length === 0 ? (
              <div
                className="text-sm py-4 text-center"
                style={{ color: "var(--text-muted)" }}>
                No saved stickers yet.
              </div>
            ) : (
              <div className="grid gap-3">
                {pastStickers.map((stk) => (
                  <div
                    key={stk._id}
                    className="flex items-center gap-3 p-2 rounded-2xl border"
                    style={{
                      background: "var(--surface-3)",
                      borderColor: "var(--border)",
                    }}>
                    <img
                      src={resolveAssetUrl(stk.imageUrl)}
                      alt="stk"
                      className="w-16 h-16 object-cover rounded-xl"
                    />
                    <div className="flex-1">
                      <div
                        className="text-sm font-medium"
                        style={{ color: "var(--text)" }}>
                        {stk.label || "Sticker"}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSidebarInsert(stk)}
                          className="px-3 py-1 bg-gray-800 text-white rounded-full text-xs font-medium hover:bg-gray-700 transition-colors">
                          Insert
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(
                              resolveAssetUrl(stk.imageUrl),
                            );
                            setSuccessMsg("Copied URL");
                          }}
                          className="px-3 py-1 border text-xs font-medium rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                          Copy URL
                        </button>
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
