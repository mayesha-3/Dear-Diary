import React, { useState, useEffect } from "react";
import "./css/Book.css";

export default function BookDupe() {
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const totalCards = 4;

  const flipLeft = () => {
    if (isFlipping || currentPage <= 0) return;
    setIsFlipping(true);
    setCurrentPage((prev) => prev - 1);
    setTimeout(() => setIsFlipping(false), 900);
  };

  const flipRight = () => {
    if (isFlipping || currentPage >= totalCards) return;
    setIsFlipping(true);
    setCurrentPage((prev) => prev + 1);
    setTimeout(() => setIsFlipping(false), 900);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFlipping(true);
      setCurrentPage(1);
      setTimeout(() => setIsFlipping(false), 900);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const getZIndex = (index: number) => {
    const isFlipped = index < currentPage;
    return isFlipped ? index : totalCards - index;
  };

  return (
    <div className="journal-container">
      {/* Invisible Hover Flip Zones */}
      <div
        className="hover-sensor-left"
        onMouseEnter={flipLeft}
        title="Hover to flip back"
      />
      <div
        className="hover-sensor-right"
        onMouseEnter={flipRight}
        title="Hover to flip forward"
      />

      <div className="book-wrapper">
        <div className={`book-3d ${currentPage > 0 ? "open" : ""}`}>
          {/* Silk Ribbon Bookmark */}
          {currentPage > 0 && currentPage < totalCards && (
            <div className="ribbon-bookmark" />
          )}

          {/* CARD 0: Cover / Page 1 */}
          <div
            className={`page-card ${currentPage > 0 ? "flipped-card" : ""}`}
            style={{ zIndex: getZIndex(0) }}
            onClick={() => (currentPage > 0 ? flipLeft() : flipRight())}>
            {/* Front: Pastel Cute Cover */}
            <div className="page-face cute-cover">
              <div className="cover-border-inner" />

              {/* Cute Corner Stickers */}
              <span className="cute-sticker top-left">🌸</span>
              <span className="cute-sticker top-right">✨</span>
              <span className="cute-sticker bottom-left">🎀</span>
              <span className="cute-sticker bottom-right">🐈</span>

              <div className="cover-title-group">
                <div className="cute-crest">☁️ 💖 ☁️</div>
                <h1 className="cover-title">momo's diary</h1>
                <div className="cute-divider" />
                <p className="cover-subtitle">a little pocket of sunshine</p>
              </div>

              <div className="cover-badge">
                <span>🌷</span>
              </div>

              <div className="cover-author">
                <p className="text-xs font-serif tracking-[0.25em] uppercase text-[#7c5295] font-semibold">
                  ~ sweet memories ~
                </p>
              </div>
            </div>

            {/* Back: Page 1 (Welcome & Profile) */}
            <div className="page-face face-back">
              <div className="notebook-page">
                <div className="diary-header-strip">
                  <span className="diary-date">Feature Spotlight</span>
                  <span className="weather-icon">🌸</span>
                </div>
                <div className="diary-text">
                  <div className="washi-tape tape-green">Safe Sanctuary ✨</div>
                  <p className="mt-8 font-serif text-lg text-[#3e3228]">
                    Welcome Home! ☁️
                  </p>
                  <p className="mt-2 leading-relaxed text-[#5c4a3e]">
                    Your quietest thoughts stay safe here. Cloud-synced
                    instantly with Firebase Auth and real-time Firestore
                    storage!
                  </p>

                  {/* Polaroid Profile Frame */}
                  <div className="polaroid-frame">
                    <div className="washi-tape tape-yellow">me 🌸</div>
                    <div className="polaroid-img-wrapper">
                      <img src="/src/assets/dp.png" alt="Profile" />
                    </div>
                    <div className="polaroid-caption">Momo</div>
                  </div>

                  <span className="sticker-cute floating-star text-3xl">
                    ⭐
                  </span>
                </div>
                <div className="page-shading" />
              </div>
            </div>
          </div>

          {/* CARD 1: Page 2 / Page 3 */}
          <div
            className={`page-card ${currentPage > 1 ? "flipped-card" : ""}`}
            style={{ zIndex: getZIndex(1) }}
            onClick={() => (currentPage > 1 ? flipLeft() : flipRight())}>
            {/* Front: Page 2 (Smart Writing & OCR Scanner) */}
            <div className="page-face">
              <div className="notebook-page">
                {currentPage === 1 && (
                  <div className="spine-spiral-rings">
                    {[...Array(7)].map((_, i) => (
                      <div key={i} className="spiral-ring" />
                    ))}
                  </div>
                )}

                <div className="diary-header-strip">
                  <span className="diary-date">Smart Inputs</span>
                  <span className="weather-icon">📸</span>
                </div>

                <div className="diary-text">
                  <p className="font-serif font-semibold text-[#4a3b30]">
                    Effortless Journaling ✍️
                  </p>
                  <p className="mt-2 leading-relaxed">
                    <b>• Smart AI Voice:</b> Speak your mind and let ambient
                    speech-to-text transcribe your entries automatically.
                  </p>
                  <p className="mt-2 leading-relaxed">
                    <b>• Scan Physical Pages:</b> Snap a photo of physical
                    handwritten journals and import them seamlessly into digital
                    memory.
                  </p>

                  <div className="sticker-group">
                    <span className="sticker-cute text-3xl hover:scale-125 transition-transform">
                      🎙️
                    </span>
                    <span className="sticker-cute text-2xl hover:scale-125 transition-transform">
                      📷
                    </span>
                  </div>
                </div>
                <div className="page-shading" />
              </div>
            </div>

            {/* Back: Page 3 (App Capabilities Checklist) */}
            <div className="page-face face-back">
              <div className="notebook-page">
                <div className="diary-header-strip">
                  <span className="diary-date">Toolbox</span>
                  <span className="weather-icon">🛠️</span>
                </div>
                <div className="diary-text">
                  <h3 className="font-serif font-bold text-[#8c7355] text-lg mb-2 flex items-center gap-2">
                    <span>What You Can Do</span>
                    <span>✨</span>
                  </h3>
                  <ul className="cute-todo-list space-y-1.5">
                    <li>
                      <input type="checkbox" defaultChecked readOnly />{" "}
                      Real-time Firestore Cloud Sync ☁️
                    </li>
                    <li>
                      <input type="checkbox" defaultChecked readOnly /> Custom
                      Sticker Factory & Drag-and-Drop 🎨
                    </li>
                    <li>
                      <input type="checkbox" defaultChecked readOnly />{" "}
                      Background Ambient Audio Player 🎵
                    </li>
                    <li>
                      <input type="checkbox" defaultChecked readOnly /> Page OCR
                      & Camera Diary Importer 📸
                    </li>
                    <li>
                      <input type="checkbox" defaultChecked readOnly /> Full
                      Memory Search & Filter Archives 🔍
                    </li>
                  </ul>

                  <span className="sticker-cute bottom-right-clover text-4xl">
                    ☘️
                  </span>
                </div>
                <div className="page-shading" />
              </div>
            </div>
          </div>

          {/* CARD 2: Page 4 / Page 5 */}
          <div
            className={`page-card ${currentPage > 2 ? "flipped-card" : ""}`}
            style={{ zIndex: getZIndex(2) }}
            onClick={() => (currentPage > 2 ? flipLeft() : flipRight())}>
            {/* Front: Page 4 (Atmosphere & Aesthetic Focus) */}
            <div className="page-face">
              <div className="notebook-page quote-page-bg">
                {currentPage === 2 && (
                  <div className="spine-spiral-rings">
                    {[...Array(7)].map((_, i) => (
                      <div key={i} className="spiral-ring" />
                    ))}
                  </div>
                )}

                <div className="diary-header-strip">
                  <span className="diary-date">Ambience</span>
                  <span className="weather-icon">🎧</span>
                </div>

                <div className="diary-text flex flex-col justify-center items-center text-center px-4 h-[75%]">
                  <span className="text-4xl text-[#c97b63] font-serif leading-none opacity-80">
                    “
                  </span>
                  <p className="text-2xl font-serif font-bold italic text-[#5a483c] my-2 leading-tight">
                    Immersion in every keystroke.
                  </p>
                  <p className="text-sm text-[#8c7355] italic font-serif">
                    Soft lo-fi melodies, calming soundscapes, and tactile 3D
                    page flips.
                  </p>
                  <span className="text-4xl text-[#c97b63] font-serif leading-none opacity-80">
                    ”
                  </span>

                  <div className="washi-tape tape-blue mt-6">
                    Global Audio On 🎵
                  </div>
                </div>
                <div className="page-shading" />
              </div>
            </div>

            {/* Back: Page 5 (Sticker Factory Showcase) */}
            <div className="page-face face-back">
              <div className="notebook-page">
                <div className="diary-header-strip">
                  <span className="diary-date">Sticker Board</span>
                  <span className="weather-icon">🎨</span>
                </div>
                <div className="diary-text">
                  <h3 className="font-serif font-semibold text-[#8c7355] text-base mb-3 text-center tracking-wide">
                    ✨ Sticker Factory Collection ✨
                  </h3>

                  <div className="grid grid-cols-3 gap-5 mt-3 justify-items-center bg-[#fdf8f0] p-4 rounded-2xl border border-[#ebdcc9]">
                    <span className="sticker-cute text-4xl hover:rotate-6 transition-transform">
                      🧸
                    </span>
                    <span className="sticker-cute text-4xl hover:-rotate-6 transition-transform">
                      🎨
                    </span>
                    <span className="sticker-cute text-4xl hover:rotate-12 transition-transform">
                      🦋
                    </span>
                    <span className="sticker-cute text-4xl hover:-rotate-12 transition-transform">
                      🍨
                    </span>
                    <span className="sticker-cute text-4xl hover:rotate-6 transition-transform">
                      💌
                    </span>
                    <span className="sticker-cute text-4xl hover:-rotate-6 transition-transform">
                      🌟
                    </span>
                  </div>

                  <div className="washi-tape tape-grey center-tape">
                    Design Your Own 🏭
                  </div>
                </div>
                <div className="page-shading" />
              </div>
            </div>
          </div>

          {/* CARD 3: Page 6 / Back Cover */}
          <div
            className={`page-card ${currentPage > 3 ? "flipped-card" : ""}`}
            style={{ zIndex: getZIndex(3) }}
            onClick={() => (currentPage > 3 ? flipLeft() : flipRight())}>
            {/* Front: Page 6 (Memory Preservation) */}
            <div className="page-face">
              <div className="notebook-page">
                {currentPage === 3 && (
                  <div className="spine-spiral-rings">
                    {[...Array(7)].map((_, i) => (
                      <div key={i} className="spiral-ring" />
                    ))}
                  </div>
                )}

                <div className="diary-header-strip">
                  <span className="diary-date">Memories</span>
                  <span className="weather-icon">🌙</span>
                </div>

                <div className="diary-text">
                  <p className="font-serif font-medium text-[#4a3b30]">
                    Your Journey Awaits,
                  </p>
                  <p className="mt-2 leading-relaxed">
                    Filter by date, tag special moments, and search through past
                    memories with ease.
                  </p>
                  <p className="mt-2 leading-relaxed">
                    Start a new entry today and make this space uniquely yours.
                  </p>

                  <div className="mt-8 text-right">
                    <p className="font-serif font-bold text-xl text-[#c97b63] tracking-wide">
                      Momo ✍️ ❤️
                    </p>
                  </div>

                  <span className="sticker-cute moon-sticker text-3xl">🌙</span>
                </div>
                <div className="page-shading" />
              </div>
            </div>

            {/* Back: Pastel Cute Back Cover */}
            <div className="page-face face-back cute-cover">
              <div className="cover-border-inner" />

              <div className="cover-title-group my-auto text-center">
                <span className="text-5xl filter drop-shadow">🌷</span>
                <p className="font-serif italic text-[#7c5295] text-sm mt-3 font-medium">
                  "Thanks for reading!"
                </p>
              </div>

              <p className="text-[11px] text-[#8e689e] font-serif tracking-[0.2em] uppercase mb-4 font-semibold">
                Momo's Diary • Made with Love 💖
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
