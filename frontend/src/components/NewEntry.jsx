import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { uploadImage } from '../api/api';

// Base URL of the API server, used to resolve "/uploads/.." paths
// returned by the upload route into full <img src> URLs.
const ASSET_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

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

  const [title, setTitle] = useState('');
  const [entryDate, setEntryDate] = useState(todayISODate());
  const [content, setContent] = useState('');

  // Stickers: { stickerId, imageUrl, x, y, width, rotation, zIndex }
  // x / y are percentages of the page container's width/height so the
  // "fixed position on page" stays correct at any screen size.
  const [stickers, setStickers] = useState([]);
  const [selectedStickerId, setSelectedStickerId] = useState(null);

  // "Pic of the day"
  const [picOfDay, setPicOfDay] = useState({ imageUrl: null, enabled: false });
  const [picUploading, setPicUploading] = useState(false);

  const [stickerUploading, setStickerUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Refs for drag handling
  const pageRef = useRef(null); // the bounding box stickers are positioned within
  const dragState = useRef(null); // { stickerId, offsetXPercent, offsetYPercent }

  // ---------------------------------------------------------------
  // Pic of the day
  // ---------------------------------------------------------------
  const handlePicOfDayChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPicUploading(true);
    setErrorMsg('');
    try {
      const imageUrl = await uploadImage(file);
      setPicOfDay({ imageUrl, enabled: true });
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to upload pic of the day.');
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
    setErrorMsg('');
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
      setErrorMsg('Failed to upload sticker.');
    } finally {
      setStickerUploading(false);
    }
  }, []);

  const handleDeleteSticker = useCallback((stickerId) => {
    setStickers((prev) => prev.filter((s) => s.stickerId !== stickerId));
    if (selectedStickerId === stickerId) setSelectedStickerId(null);
  }, [selectedStickerId]);

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

    const newXPercent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100 - offsetXPercent));
    const newYPercent = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100 - offsetYPercent));

    setStickers((prev) =>
      prev.map((s) => (s.stickerId === stickerId ? { ...s, x: newXPercent, y: newYPercent } : s))
    );
  };

  const handleMouseUp = () => {
    dragState.current = null;
  };

  // ---------------------------------------------------------------
  // Save entry
  // ---------------------------------------------------------------
  const handleSave = useCallback(async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMsg('Title and content are required.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        title: title.trim(),
        content,
        excerpt: content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180),
        entryDate,
        stickers,
        picOfTheDay: picOfDay,
      };

      const res = await api.post('/entries', payload);
      setSuccessMsg('Entry saved successfully!');

      // Redirect to the new entry after a short delay
      setTimeout(() => {
        navigate(`/entry/${res.data.entryId}`);
      }, 500);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to save entry.');
    } finally {
      setSaving(false);
    }
  }, [title, content, entryDate, stickers, picOfDay, navigate]);

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">New Entry</h1>

      {errorMsg && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{errorMsg}</div>}
      {successMsg && <div className="bg-green-100 text-green-700 p-4 rounded mb-4">{successMsg}</div>}

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

        {/* Rich Text Editor */}
        <div>
          <label className="block text-sm font-medium mb-2">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-4 py-3 border rounded font-mono text-sm"
            rows="12"
            placeholder="Write your diary entry here..."
          />
          <p className="text-xs text-gray-500 mt-2">You can use basic HTML if needed: &lt;b&gt;bold&lt;/b&gt;, &lt;i&gt;italic&lt;/i&gt;, &lt;br&gt; for line breaks, etc.</p>
        </div>

        {/* Pic of the Day */}
        <div>
          <label className="block text-sm font-medium mb-2">Pic of the Day</label>
          {picOfDay.imageUrl && (
            <div className="mb-4">
              <img src={resolveAssetUrl(picOfDay.imageUrl)} alt="Pic of day" width={150} className="rounded" />
              <button
                type="button"
                onClick={() => setPicOfDay({ imageUrl: null, enabled: false })}
                className="mt-2 px-3 py-1 bg-red-500 text-white rounded"
              >
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
          {picUploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
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
          {stickerUploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
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
              style={{ minHeight: '300px' }}
            >
              {stickers.map((sticker) => (
                <div
                  key={sticker.stickerId}
                  onMouseDown={(e) => handleMouseDown(e, sticker.stickerId)}
                  onClick={() => setSelectedStickerId(sticker.stickerId)}
                  className={`absolute cursor-move ${selectedStickerId === sticker.stickerId ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                    left: `${sticker.x}%`,
                    top: `${sticker.y}%`,
                    width: `${sticker.width}px`,
                    height: 'auto',
                    transform: `translateX(-50%) translateY(-50%) rotate(${sticker.rotation}deg)`,
                    zIndex: sticker.zIndex,
                  }}
                >
                  <img
                    src={resolveAssetUrl(sticker.imageUrl)}
                    alt="sticker"
                    className="w-full h-auto pointer-events-none"
                  />
                  {selectedStickerId === sticker.stickerId && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSticker(sticker.stickerId)}
                      className="absolute -top-6 -right-6 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full px-6 py-3 bg-gray-900 text-white rounded font-semibold hover:bg-gray-700 disabled:bg-gray-400"
        >
          {saving ? 'Saving...' : 'Save Entry'}
        </button>
      </form>
    </main>
  );
}
