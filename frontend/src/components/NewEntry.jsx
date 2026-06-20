import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { uploadImage } from '../api/api';

// Base URL of the API server, used to resolve "/uploads/.." paths
// returned by the upload route into full <img src> URLs.
const ASSET_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5100/api').replace(/\/api\/?$/, '');

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

    dragState.current = { stickerId, offsetXPercent, offsetYPercent };
    setSelectedStickerId(stickerId);
  };

  const handleMouseMove = (e) => {
    if (!dragState.current || !pageRef.current) return;

    const rect = pageRef.current.getBoundingClientRect();
    const { stickerId, offsetXPercent, offsetYPercent } = dragState.current;

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
    <main className="container mx-auto mt-8 p-6 bg-white border-[3px] border-black rounded-[40px] shadow-2xl relative overflow-hidden">
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

        {/* Content Box */}
        <div>
          <h4 className="text-xl font-bold mb-4">✍️ Thoughts & Feelings ✨</h4>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border-2 border-gray-300 rounded-3xl p-6"
            rows="12"
            placeholder="Write your diary entry here or scan a PDF to populate..."
          />
          <p className="text-xs text-gray-500 mt-2">
            You can use basic HTML if needed: &lt;b&gt;bold&lt;/b&gt;,
            &lt;i&gt;italic&lt;/i&gt;, &lt;br&gt; for line breaks, etc.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">

  {/* Left Side */}

  <div className="relative">

    <div className="absolute -top-5 -left-4 rotate-[-20deg] text-3xl">  📸</div>
    <div className="absolute -bottom-4 -left-3 text-3xl">🌼</div>
    <div className="absolute -top-2 right-2 text-3xl">✂️</div>
    <div className="absolute bottom-2 right-2 text-3xl">🖇️</div>

    <div className="border-2 border-gray-300 rounded-3xl p-4 bg-white">

      {picOfDay.imageUrl ? (
        <img
          src={resolveAssetUrl(picOfDay.imageUrl)}
          alt=""
          className="w-full h-72 object-cover rounded-xl"
        />
      ) : (
        <div className="h-72 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-xl">
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

      <h3 className="text-xl font-semibold mb-3">
        How do I feel today?
      </h3>

      <div className="flex gap-3 flex-wrap">

        <button
          type="button"
          onClick={() => setMood("Good")}
          className={`px-4 py-2 rounded-full border-2 border-gray-300 ${
            mood === "Good" ? "bg-black text-white" : ""
          }`}
        >          😊 Good        </button>

        <button
          type="button"
          onClick={() => setMood("Okay")}
          className={`px-4 py-2 rounded-full border-2 border-gray-300 ${
            mood === "Okay" ? "bg-black text-white" : ""
          }`}
        >          🙂 Okay        </button>

        <button
          type="button"
          onClick={() => setMood("Bad")}
          className={`px-4 py-2 rounded-full border-2 border-gray-300 ${
            mood === "Bad" ? "bg-black text-white" : ""
          }`}
        >          😔 Bad        </button>

      </div>

    </div>

    <div className="border-2 border-gray-300 rounded-3xl p-4">

      <h3 className="font-semibold mb-2">
        🎀 Activity of the Day
      </h3>

      <textarea
        value={activity}
        onChange={(e) => setActivity(e.target.value)}
        rows="4"
        className="w-full outline-none"
      />

    </div>

  </div>

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
          className="w-full px-6 py-3 bg-gray-900 text-white rounded font-semibold hover:bg-gray-700 disabled:bg-gray-400">
          {saving ? "Saving..." : "Save Entry"}
        </button>
      </form>
    </main>
  );
}
