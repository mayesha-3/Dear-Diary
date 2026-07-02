import React, { useEffect, useRef, useState } from 'react';
import api, { uploadImage } from '../api/api';

const CANVAS_SIZE = 560;
const HANDLE_SIZE = 12;
const ASSET_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/api\/?$/, '');

function resolveAssetUrl(url) {
  if (!url) return url;
  return url.startsWith('http') ? url : `${ASSET_BASE_URL}${url}`;
}

function getPointerPosition(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(CANVAS_SIZE, e.clientX - rect.left)),
    y: Math.max(0, Math.min(CANVAS_SIZE, e.clientY - rect.top)),
  };
}

function dataURLToBlob(dataUrl) {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)[1];
  const binary = atob(parts[1]);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    buffer[i] = binary.charCodeAt(i);
  }
  return new Blob([buffer], { type: mime });
}

export default function StickerFactory() {
  const canvasRef = useRef(null);
  const [layers, setLayers] = useState([]);
  const [drawPaths, setDrawPaths] = useState([]);
  const [history, setHistory] = useState([]);
  const [currentPath, setCurrentPath] = useState(null);
  const [brushColor, setBrushColor] = useState('#1d4ed8');
  const [brushSize, setBrushSize] = useState(8);
  const [mode, setMode] = useState('brush');
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [pastStickers, setPastStickers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingStickers, setLoadingStickers] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    layers.forEach((layer) => {
      if (layer.type === 'image' && layer.image) {
        ctx.drawImage(layer.image, layer.x, layer.y, layer.width, layer.height);
        if (layer.id === selectedLayerId) {
          ctx.strokeStyle = '#2563eb';
          ctx.lineWidth = 2;
          ctx.strokeRect(layer.x - 2, layer.y - 2, layer.width + 4, layer.height + 4);
          // draw resize handle (bottom-right)
          ctx.fillStyle = '#fff';
          ctx.strokeStyle = '#2563eb';
          ctx.lineWidth = 1;
          const hx = layer.x + layer.width - HANDLE_SIZE / 2;
          const hy = layer.y + layer.height - HANDLE_SIZE / 2;
          ctx.fillRect(hx, hy, HANDLE_SIZE, HANDLE_SIZE);
          ctx.strokeRect(hx, hy, HANDLE_SIZE, HANDLE_SIZE);
        }
      }
    });

    const drawSinglePath = (path) => {
      if (!path?.points?.length) return;
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      path.points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    };

    drawPaths.forEach(drawSinglePath);
    drawSinglePath(currentPath);
  };

  useEffect(() => {
    redrawCanvas();
  }, [layers, drawPaths, currentPath]);

  useEffect(() => {
    loadPastStickers();
  }, []);

  const loadPastStickers = async () => {
    setLoadingStickers(true);
    try {
      const res = await api.get('/stickers');
      setPastStickers(res.data.stickers || []);
    } catch (err) {
      console.error('Could not load stickers:', err);
      setStatusMessage('Unable to load saved stickers.');
    } finally {
      setLoadingStickers(false);
    }
  };

  const pushHistory = () => {
    setHistory((h) => [...h, { layers: JSON.parse(JSON.stringify(layers)), drawPaths: JSON.parse(JSON.stringify(drawPaths)) }]);
  };

  const handleUndo = () => {
    if (drawPaths.length > 0) {
      setDrawPaths((prev) => prev.slice(0, -1));
      setStatusMessage('Undid last brush stroke.');
      return;
    }
    if (layers.length > 0) {
      setLayers((prev) => prev.slice(0, -1));
      setStatusMessage('Removed last image layer.');
      return;
    }
    // fallback to full history
    setHistory((h) => {
      if (!h.length) return h;
      const last = h[h.length - 1];
      setLayers(last.layers || []);
      setDrawPaths(last.drawPaths || []);
      setStatusMessage('Reverted to previous state.');
      return h.slice(0, -1);
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const defaultSize = Math.min(240, image.width, image.height);
        const layer = {
          id: `layer-${Date.now()}`,
          type: 'image',
          image,
          x: (CANVAS_SIZE - defaultSize) / 2,
          y: (CANVAS_SIZE - defaultSize) / 2,
          width: defaultSize,
          height: defaultSize,
        };
        pushHistory();
        setLayers((prev) => [...prev, layer]);
        setSelectedLayerId(layer.id);
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const handleCanvasPointerDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getPointerPosition(e, canvas);

    if (mode === 'brush') {
      pushHistory();
      setCurrentPath({ color: brushColor, size: brushSize, points: [pos] });
      return;
    }

    const hitLayer = [...layers].reverse().find((layer) => {
      return (
        pos.x >= layer.x &&
        pos.x <= layer.x + layer.width &&
        pos.y >= layer.y &&
        pos.y <= layer.y + layer.height
      );
    });

    if (hitLayer) {
      // detect if pointer is on resize handle
      const hx = hitLayer.x + hitLayer.width - HANDLE_SIZE / 2;
      const hy = hitLayer.y + hitLayer.height - HANDLE_SIZE / 2;
      const onHandle = pos.x >= hx && pos.x <= hx + HANDLE_SIZE && pos.y >= hy && pos.y <= hy + HANDLE_SIZE;
      setSelectedLayerId(hitLayer.id);
      pushHistory();
      if (onHandle) {
        setDragState({ mode: 'resize', layerId: hitLayer.id, startX: pos.x, startY: pos.y, startWidth: hitLayer.width, startHeight: hitLayer.height });
      } else {
        setDragState({ mode: 'move', layerId: hitLayer.id, offsetX: pos.x - hitLayer.x, offsetY: pos.y - hitLayer.y });
      }
    } else {
      setSelectedLayerId(null);
    }
  };

  const handleCanvasPointerMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getPointerPosition(e, canvas);

    if (currentPath) {
      setCurrentPath((prev) => {
        if (!prev) return prev;
        return { ...prev, points: [...prev.points, pos] };
      });
      return;
    }

    if (dragState) {
      if (dragState.mode === 'move') {
        setLayers((prev) =>
          prev.map((layer) =>
            layer.id === dragState.layerId
              ? { ...layer, x: pos.x - dragState.offsetX, y: pos.y - dragState.offsetY }
              : layer,
          ),
        );
      } else if (dragState.mode === 'resize') {
        setLayers((prev) =>
          prev.map((layer) => {
            if (layer.id !== dragState.layerId) return layer;
            const deltaX = pos.x - dragState.startX;
            const deltaY = pos.y - dragState.startY;
            const newW = Math.max(20, Math.round(dragState.startWidth + deltaX));
            const newH = Math.max(20, Math.round(dragState.startHeight + deltaY));
            return { ...layer, width: newW, height: newH };
          }),
        );
      }
    }
  };

  const handleCanvasPointerUp = () => {
    if (currentPath) {
      setDrawPaths((prev) => [...prev, currentPath]);
      setCurrentPath(null);
    }
    setDragState(null);
  };

  const handleDeleteSelectedLayer = () => {
    if (!selectedLayerId) return;
    pushHistory();
    setLayers((prev) => prev.filter((l) => l.id !== selectedLayerId));
    setSelectedLayerId(null);
    setStatusMessage('Layer removed.');
  };

  const handleUpdateSelectedLayer = (updates) => {
    if (!selectedLayerId) return;
    pushHistory();
    setLayers((prev) => prev.map((l) => (l.id === selectedLayerId ? { ...l, ...updates } : l)));
  };

  const handleSaveSticker = async () => {
    setSaving(true);
    setStatusMessage('Saving sticker...');
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/png');
      const blob = dataURLToBlob(dataUrl);
      const file = new File([blob], `sticker-${Date.now()}.png`, { type: 'image/png' });
      const imageUrl = await uploadImage(file);
      await api.post('/stickers', { imageUrl, filename: file.name, label: 'Sticker Factory' });
      setStatusMessage('Sticker saved successfully.');
      loadPastStickers();
    } catch (err) {
      console.error('Failed to save sticker:', err);
      setStatusMessage('Failed to save sticker.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `sticker-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const downloadStickerImage = (sticker) => {
    const imageUrl = resolveAssetUrl(sticker.imageUrl);
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = sticker.filename || 'sticker.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deletePastSticker = async (stickerId) => {
    if (!stickerId) return;
    if (!confirm('Delete this sticker? This cannot be undone.')) return;
    try {
      await api.delete(`/stickers/${stickerId}`);
      setStatusMessage('Sticker deleted.');
      loadPastStickers();
    } catch (err) {
      console.error('Failed to delete sticker:', err);
      setStatusMessage('Failed to delete sticker.');
    }
  };

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-6">Sticker Factory</h1>
      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="w-full lg:w-64 bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-lg mb-4">Tools</h2>
          <button
            type="button"
            onClick={() => setMode('brush')}
            className={`w-full text-left px-4 py-3 mb-3 rounded-lg ${mode === 'brush' ? 'bg-blue-600 text-white' : 'bg-white text-slate-800 border border-slate-200'}`}
          >
            Paintbrush
          </button>
          <button
            type="button"
            onClick={() => setMode('move')}
            className={`w-full text-left px-4 py-3 mb-3 rounded-lg ${mode === 'move' ? 'bg-blue-600 text-white' : 'bg-white text-slate-800 border border-slate-200'}`}
          >
            Move images
          </button>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Brush color</label>
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="w-full h-10 p-0 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Brush size</label>
              <input
                type="range"
                min="2"
                max="24"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-slate-500 mt-1">{brushSize}px</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Add image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleUndo}
                className="flex-1 px-4 py-2 bg-yellow-400 text-white rounded-lg"
              >
                Undo
              </button>
              <button
                type="button"
                onClick={handleDeleteSelectedLayer}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg"
              >
                Delete Layer
              </button>
            </div>
            <div>
              <button
                type="button"
                onClick={handleDownload}
                className="w-full px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
              >
                Download PNG
              </button>
            </div>
            <div>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveSticker}
                className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Sticker'}
              </button>
            </div>
          </div>
        </aside>

        <section className="flex-1">
          <div className="mx-auto mb-4" style={{ maxWidth: CANVAS_SIZE + 32 }}>
            <div className="grid place-items-center bg-slate-100 p-4 rounded-3xl border border-slate-200 shadow-sm">
              <div className="relative">
                <div className="absolute -left-20 top-10 w-16 h-16 rounded-full bg-blue-200 grid place-items-center text-blue-800 text-sm shadow-lg">
                  Brush
                </div>
                <canvas
                  ref={canvasRef}
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                  className="border border-slate-300 rounded-xl bg-white"
                  onMouseDown={handleCanvasPointerDown}
                  onMouseMove={handleCanvasPointerMove}
                  onMouseUp={handleCanvasPointerUp}
                  onMouseLeave={handleCanvasPointerUp}
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            {selectedLayerId && (
              <div className="mb-4 p-3 border border-slate-100 rounded">
                <h3 className="font-medium mb-2">Selected Layer Controls</h3>
                <div className="grid grid-cols-2 gap-3 items-center">
                  <label className="text-sm">Width</label>
                  <input type="range" min="20" max="560" value={(layers.find(l=>l.id===selectedLayerId)?.width)||120} onChange={(e)=>handleUpdateSelectedLayer({width: Number(e.target.value)})} />
                  <label className="text-sm">Height</label>
                  <input type="range" min="20" max="560" value={(layers.find(l=>l.id===selectedLayerId)?.height)||120} onChange={(e)=>handleUpdateSelectedLayer({height: Number(e.target.value)})} />
                  <label className="text-sm">Rotation</label>
                  <input type="range" min="-180" max="180" value={(layers.find(l=>l.id===selectedLayerId)?.rotation)||0} onChange={(e)=>handleUpdateSelectedLayer({rotation: Number(e.target.value)})} />
                </div>
              </div>
            )}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-xl">Past Stickers</h2>
                <p className="text-sm text-slate-500">Your saved sticker library appears here.</p>
              </div>
              {statusMessage && <span className="text-sm text-slate-600">{statusMessage}</span>}
            </div>
            {loadingStickers ? (
              <div className="p-6 text-center text-slate-500">Loading stickers...</div>
            ) : pastStickers.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No saved stickers yet.</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pastStickers.map((sticker) => (
                  <div key={sticker._id} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                    <img onClick={() => downloadStickerImage(sticker)} role="button" style={{cursor:'pointer'}} src={resolveAssetUrl(sticker.imageUrl)} alt={sticker.label || 'Saved sticker'} className="w-full h-40 object-cover" />
                    <div className="p-3 space-y-2">
                      <p className="text-sm font-medium text-slate-800">{sticker.label || 'Sticker'}</p>
                                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const imageUrl = resolveAssetUrl(sticker.imageUrl);
                            fetch(imageUrl)
                              .then((res) => res.blob())
                              .then((blob) => {
                                const item = new ClipboardItem({ [blob.type]: blob });
                                return navigator.clipboard.write([item]);
                              })
                              .then(() => setStatusMessage('Sticker image copied to clipboard.'))
                              .catch((err) => {
                                console.error('Copy image failed:', err);
                                setStatusMessage('Failed to copy image.');
                              });
                          }}
                          className="flex-1 px-3 py-2 bg-slate-900 text-white rounded-lg text-sm"
                        >
                          Copy Image
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePastSticker(sticker._id)}
                          className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
