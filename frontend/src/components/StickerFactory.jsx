import React, { useEffect, useRef, useState } from "react";
import api, { uploadImage } from "../api/api";

const CANVAS_SIZE = 560;
const HANDLE_SIZE = 12;
const ASSET_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5001/api"
).replace(/\/api\/?$/, "");

function resolveAssetUrl(url) {
  if (!url) return url;
  return url.startsWith("http") ? url : `${ASSET_BASE_URL}${url}`;
}

function getPointerPosition(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(CANVAS_SIZE, e.clientX - rect.left)),
    y: Math.max(0, Math.min(CANVAS_SIZE, e.clientY - rect.top)),
  };
}

function dataURLToBlob(dataUrl) {
  const parts = dataUrl.split(",");
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
  const [brushColor, setBrushColor] = useState("#1d4ed8");
  const [brushSize, setBrushSize] = useState(8);
  const [mode, setMode] = useState("brush");
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [pastStickers, setPastStickers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingStickers, setLoadingStickers] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    layers.forEach((layer) => {
      if (layer.type === "image" && layer.image) {
        ctx.drawImage(layer.image, layer.x, layer.y, layer.width, layer.height);
        if (layer.id === selectedLayerId) {
          ctx.strokeStyle = "#2563eb";
          ctx.lineWidth = 2;
          ctx.strokeRect(
            layer.x - 2,
            layer.y - 2,
            layer.width + 4,
            layer.height + 4,
          );
          // draw resize handle (bottom-right)
          ctx.fillStyle = "#fff";
          ctx.strokeStyle = "#2563eb";
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
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
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
      const res = await api.get("/stickers");
      setPastStickers(res.data.stickers || []);
    } catch (err) {
      console.error("Could not load stickers:", err);
      setStatusMessage("Unable to load saved stickers.");
    } finally {
      setLoadingStickers(false);
    }
  };

  const pushHistory = () => {
    setHistory((h) => [
      ...h,
      {
        layers: JSON.parse(JSON.stringify(layers)),
        drawPaths: JSON.parse(JSON.stringify(drawPaths)),
      },
    ]);
  };

  const handleUndo = () => {
    if (drawPaths.length > 0) {
      setDrawPaths((prev) => prev.slice(0, -1));
      setStatusMessage("Undid last brush stroke.");
      return;
    }
    if (layers.length > 0) {
      setLayers((prev) => prev.slice(0, -1));
      setStatusMessage("Removed last image layer.");
      return;
    }
    // fallback to full history
    setHistory((h) => {
      if (!h.length) return h;
      const last = h[h.length - 1];
      setLayers(last.layers || []);
      setDrawPaths(last.drawPaths || []);
      setStatusMessage("Reverted to previous state.");
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
          type: "image",
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

    if (mode === "brush") {
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
      const onHandle =
        pos.x >= hx &&
        pos.x <= hx + HANDLE_SIZE &&
        pos.y >= hy &&
        pos.y <= hy + HANDLE_SIZE;
      setSelectedLayerId(hitLayer.id);
      pushHistory();
      if (onHandle) {
        setDragState({
          mode: "resize",
          layerId: hitLayer.id,
          startX: pos.x,
          startY: pos.y,
          startWidth: hitLayer.width,
          startHeight: hitLayer.height,
        });
      } else {
        setDragState({
          mode: "move",
          layerId: hitLayer.id,
          offsetX: pos.x - hitLayer.x,
          offsetY: pos.y - hitLayer.y,
        });
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
      if (dragState.mode === "move") {
        setLayers((prev) =>
          prev.map((layer) =>
            layer.id === dragState.layerId
              ? {
                  ...layer,
                  x: pos.x - dragState.offsetX,
                  y: pos.y - dragState.offsetY,
                }
              : layer,
          ),
        );
      } else if (dragState.mode === "resize") {
        setLayers((prev) =>
          prev.map((layer) => {
            if (layer.id !== dragState.layerId) return layer;
            const deltaX = pos.x - dragState.startX;
            const deltaY = pos.y - dragState.startY;
            const newW = Math.max(
              20,
              Math.round(dragState.startWidth + deltaX),
            );
            const newH = Math.max(
              20,
              Math.round(dragState.startHeight + deltaY),
            );
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
    setStatusMessage("Layer removed.");
  };

  const handleUpdateSelectedLayer = (updates) => {
    if (!selectedLayerId) return;
    pushHistory();
    setLayers((prev) =>
      prev.map((l) => (l.id === selectedLayerId ? { ...l, ...updates } : l)),
    );
  };

  const handleSaveSticker = async () => {
    setSaving(true);
    setStatusMessage("Saving sticker...");
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dataUrl = canvas.toDataURL("image/png");
      const blob = dataURLToBlob(dataUrl);
      const file = new File([blob], `sticker-${Date.now()}.png`, {
        type: "image/png",
      });
      const imageUrl = await uploadImage(file);
      await api.post("/stickers", {
        imageUrl,
        filename: file.name,
        label: "Sticker Factory",
      });
      setStatusMessage("Sticker saved successfully.");
      loadPastStickers();
    } catch (err) {
      console.error("Failed to save sticker:", err);
      setStatusMessage("Failed to save sticker.");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `sticker-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const downloadStickerImage = (sticker) => {
    const imageUrl = resolveAssetUrl(sticker.imageUrl);
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = sticker.filename || "sticker.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deletePastSticker = async (stickerId) => {
    if (!stickerId) return;
    if (!confirm("Delete this sticker? This cannot be undone.")) return;
    try {
      await api.delete(`/stickers/${stickerId}`);
      setStatusMessage("Sticker deleted.");
      loadPastStickers();
    } catch (err) {
      console.error("Failed to delete sticker:", err);
      setStatusMessage("Failed to delete sticker.");
    }
  };

  return (
    <main
      className="p-6 transition-colors duration-300"
      style={{ color: "var(--text)" }}>
      <h1
        className="text-3xl font-bold mb-6 tracking-tight"
        style={{ color: "var(--text-h)" }}>
        Sticker Factory
      </h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Controls */}
        <aside
          className="w-full lg:w-72 rounded-3xl p-5 border shadow-xl transition-colors shrink-0"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}>
          <h2
            className="font-bold text-lg mb-4"
            style={{ color: "var(--text-h)" }}>
            Tools & Settings
          </h2>

          {/* Mode Switcher */}
          <div
            className="p-1 rounded-xl mb-5 flex gap-1 border"
            style={{
              background: "var(--surface-2)",
              borderColor: "var(--border)",
            }}>
            <button
              type="button"
              onClick={() => setMode("brush")}
              className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all"
              style={{
                background:
                  mode === "brush"
                    ? "var(--accent-strong, #5b7cff)"
                    : "transparent",
                color: mode === "brush" ? "#ffffff" : "var(--text-muted)",
              }}>
              🎨 Paintbrush
            </button>
            <button
              type="button"
              onClick={() => setMode("move")}
              className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all"
              style={{
                background:
                  mode === "move"
                    ? "var(--accent-strong, #5b7cff)"
                    : "transparent",
                color: mode === "move" ? "#ffffff" : "var(--text-muted)",
              }}>
              🖐️ Move Layer
            </button>
          </div>

          <div className="space-y-4">
            {/* Color Picker */}
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: "var(--text-muted)" }}>
                Brush Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="w-12 h-10 p-0.5 border rounded-xl cursor-pointer bg-transparent"
                  style={{ borderColor: "var(--border)" }}
                />
                <span
                  className="text-sm font-mono"
                  style={{ color: "var(--text)" }}>
                  {brushColor}
                </span>
              </div>
            </div>

            {/* Size Slider */}
            <div>
              <div
                className="flex justify-between text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: "var(--text-muted)" }}>
                <span>Brush Size</span>
                <span>{brushSize}px</span>
              </div>
              <input
                type="range"
                min="2"
                max="24"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full accent-[#5b7cff]"
              />
            </div>

            {/* Add Image Layer */}
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: "var(--text-muted)" }}>
                Add Image Layer
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#5b7cff] file:text-white hover:file:opacity-90 cursor-pointer"
                style={{ color: "var(--text-muted)" }}
              />
            </div>

            <hr style={{ borderColor: "var(--border)" }} />

            {/* Undo & Delete Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleUndo}
                className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-transform active:scale-95 border"
                style={{
                  background: "var(--surface-3)",
                  color: "var(--text)",
                  borderColor: "var(--border)",
                }}>
                ↩ Undo
              </button>
              <button
                type="button"
                onClick={handleDeleteSelectedLayer}
                disabled={!selectedLayerId}
                className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-40 transition-transform active:scale-95">
                🗑 Delete
              </button>
            </div>

            {/* Export & Save Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleDownload}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold border transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: "var(--surface-2)",
                  color: "var(--text-h)",
                  borderColor: "var(--border)",
                }}>
                📥 Download PNG
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveSticker}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                style={{ background: "var(--accent-strong, #10b981)" }}>
                {saving ? "Saving..." : "✨ Save Sticker"}
              </button>
            </div>
          </div>
        </aside>

        {/* Canvas & Main Workspace */}
        <section className="flex-1 space-y-6">
          <div
            className="flex justify-center p-6 rounded-3xl border shadow-xl transition-colors"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}>
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="rounded-2xl cursor-crosshair shadow-inner"
              style={{ border: "1px solid var(--border)" }}
              onMouseDown={handleCanvasPointerDown}
              onMouseMove={handleCanvasPointerMove}
              onMouseUp={handleCanvasPointerUp}
              onMouseLeave={handleCanvasPointerUp}
            />
          </div>

          {/* Selected Layer Fine Controls */}
          {selectedLayerId && (
            <div
              className="rounded-2xl border p-5 transition-colors"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}>
              <h3
                className="text-sm font-bold mb-3"
                style={{ color: "var(--text-h)" }}>
                Selected Layer Properties
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div>
                  <label
                    className="block text-xs mb-1"
                    style={{ color: "var(--text-muted)" }}>
                    Width
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="560"
                    value={
                      layers.find((l) => l.id === selectedLayerId)?.width || 120
                    }
                    onChange={(e) =>
                      handleUpdateSelectedLayer({
                        width: Number(e.target.value),
                      })
                    }
                    className="w-full accent-[#5b7cff]"
                  />
                </div>
                <div>
                  <label
                    className="block text-xs mb-1"
                    style={{ color: "var(--text-muted)" }}>
                    Height
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="560"
                    value={
                      layers.find((l) => l.id === selectedLayerId)?.height ||
                      120
                    }
                    onChange={(e) =>
                      handleUpdateSelectedLayer({
                        height: Number(e.target.value),
                      })
                    }
                    className="w-full accent-[#5b7cff]"
                  />
                </div>
                <div>
                  <label
                    className="block text-xs mb-1"
                    style={{ color: "var(--text-muted)" }}>
                    Rotation
                  </label>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={
                      layers.find((l) => l.id === selectedLayerId)?.rotation ||
                      0
                    }
                    onChange={(e) =>
                      handleUpdateSelectedLayer({
                        rotation: Number(e.target.value),
                      })
                    }
                    className="w-full accent-[#5b7cff]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Past Saved Stickers Library */}
          <div
            className="rounded-3xl p-6 border shadow-xl transition-colors"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2
                  className="font-bold text-xl"
                  style={{ color: "var(--text-h)" }}>
                  Past Stickers
                </h2>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-muted)" }}>
                  Your saved sticker library appears here.
                </p>
              </div>
              {statusMessage && (
                <span
                  className="text-xs font-medium px-3 py-1 rounded-full border"
                  style={{
                    background: "var(--surface-3)",
                    borderColor: "var(--border)",
                    color: "var(--text-muted)",
                  }}>
                  {statusMessage}
                </span>
              )}
            </div>

            {loadingStickers ? (
              <div
                className="p-8 text-center text-sm"
                style={{ color: "var(--text-muted)" }}>
                Loading stickers...
              </div>
            ) : pastStickers.length === 0 ? (
              <div
                className="p-8 text-center text-sm"
                style={{ color: "var(--text-muted)" }}>
                No saved stickers yet.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pastStickers.map((sticker) => (
                  <div
                    key={sticker._id}
                    className="rounded-2xl overflow-hidden border transition-all hover:scale-[1.02]"
                    style={{
                      borderColor: "var(--border)",
                      background: "var(--surface-2)",
                    }}>
                    <img
                      onClick={() => downloadStickerImage(sticker)}
                      role="button"
                      src={resolveAssetUrl(sticker.imageUrl)}
                      alt={sticker.label || "Saved sticker"}
                      className="w-full h-40 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    />
                    <div className="p-3 space-y-2">
                      <p
                        className="text-xs font-semibold"
                        style={{ color: "var(--text-h)" }}>
                        {sticker.label || "Sticker"}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const imageUrl = resolveAssetUrl(sticker.imageUrl);
                            fetch(imageUrl)
                              .then((res) => res.blob())
                              .then((blob) => {
                                const item = new ClipboardItem({
                                  [blob.type]: blob,
                                });
                                return navigator.clipboard.write([item]);
                              })
                              .then(() =>
                                setStatusMessage(
                                  "Sticker image copied to clipboard.",
                                ),
                              )
                              .catch((err) => {
                                console.error("Copy image failed:", err);
                                setStatusMessage("Failed to copy image.");
                              });
                          }}
                          className="flex-1 py-1.5 px-2 rounded-xl text-xs font-medium border transition-colors"
                          style={{
                            background: "var(--surface-3)",
                            color: "var(--text)",
                            borderColor: "var(--border)",
                          }}>
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePastSticker(sticker._id)}
                          className="flex-1 py-1.5 px-2 rounded-xl text-xs font-medium text-white bg-red-500 hover:bg-red-600 transition-colors">
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
