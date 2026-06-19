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
    setTimeout(() => setIsFlipping(false), 900); // cooldown matches transition
  };

  const flipRight = () => {
    if (isFlipping || currentPage >= totalCards) return;
    setIsFlipping(true);
    setCurrentPage((prev) => prev + 1);
    setTimeout(() => setIsFlipping(false), 900);
  };

  // Trigger auto-open on mount (refresh)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFlipping(true);
      setCurrentPage(1);
      setTimeout(() => setIsFlipping(false), 900);
    }, 1500); // Wait 1.5s then flip cover open
    return () => clearTimeout(timer);
  }, []);

  // Calculate dynamic z-index for realistic stacking
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
          
          {/* Silk Ribbon Bookmark (visible only when book is open) */}
          {currentPage > 0 && currentPage < totalCards && (
            <div className="ribbon-bookmark" />
          )}

          {/* CARD 0: Cover / Page 1 */}
          <div
            className={`page-card ${currentPage > 0 ? "flipped-card" : ""}`}
            style={{ zIndex: getZIndex(0) }}
            onClick={() => (currentPage > 0 ? flipLeft() : flipRight())}
          >
            {/* Front: Leather Cover */}
            <div className="page-face leather-cover">
              <div className="cover-corner corner-tl" />
              <div className="cover-corner corner-tr" />
              <div className="cover-corner corner-bl" />
              <div className="cover-corner corner-br" />
              
              <div className="cover-title-group">
                <h1 className="cover-title">MY DIARY</h1>
                <p className="cover-subtitle">collected memories</p>
              </div>
              
              <div className="cover-emboss">M</div>
              <p className="text-xs text-[#ffe494] opacity-50 tracking-widest uppercase">Est. 2026</p>
            </div>

            {/* Back: Page 1 (Welcome Page) */}
            <div className="page-face face-back">
              <div className="notebook-page">
                <div className="diary-date">June 19, 2026</div>
                <div className="diary-text">
                  <div className="washi-tape" style={{ top: '15px', right: '35px', transform: 'rotate(4deg)', background: '#d4edda' }}>
                    Welcome! ✨
                  </div>
                  <p className="mt-8">Hello there!</p>
                  <p className="mt-2">
                    Welcome to my little corner of the world. This is where I keep all my thoughts, daily entries, and memories.
                  </p>
                  
                  {/* Polaroid Frame */}
                  <div className="polaroid-frame" style={{ bottom: '35px', left: '45px', transform: 'rotate(-4deg)', width: '130px', height: '150px' }}>
                    <div className="washi-tape" style={{ top: '-12px', left: '15px', transform: 'rotate(2deg)', background: '#ffeeba' }}>
                      me 🌸
                    </div>
                    <img src="/src/assets/dp.png" alt="Profile" />
                    <div className="polaroid-caption">Mayesha</div>
                  </div>

                  <span className="sticker-cute text-3xl" style={{ right: '40px', bottom: '60px', transform: 'rotate(10deg)' }}>⭐</span>
                </div>
                <div className="page-shading" />
              </div>
            </div>
          </div>

          {/* CARD 1: Page 2 / Page 3 */}
          <div
            className={`page-card ${currentPage > 1 ? "flipped-card" : ""}`}
            style={{ zIndex: getZIndex(1) }}
            onClick={() => (currentPage > 1 ? flipLeft() : flipRight())}
          >
            {/* Front: Page 2 (Diary Entry) */}
            <div className="page-face">
              <div className="notebook-page">
                {/* Spiral Ring Binder Hooks on the left of Page 2 (Right side page) */}
                {currentPage === 1 && (
                  <div className="spine-spiral-rings">
                    <div className="spiral-ring" />
                    <div className="spiral-ring" />
                    <div className="spiral-ring" />
                    <div className="spiral-ring" />
                    <div className="spiral-ring" />
                    <div className="spiral-ring" />
                    <div className="spiral-ring" />
                  </div>
                )}
                
                <div className="diary-date">June 20, 2026</div>
                <div className="diary-text">
                  <p>Dear Diary,</p>
                  <p className="mt-2">
                    Today I successfully migrated the entire backend to Firebase Authentication and Cloud Firestore! 
                  </p>
                  <p className="mt-2">
                    The MongoDB dependencies are gone, and the database calls are now blazing fast. I also designed a gorgeous parchment-style authentication page. Writing diaries is so much fun now!
                  </p>
                  
                  <span className="sticker-cute text-4xl" style={{ right: '25px', bottom: '50px', transform: 'rotate(-12deg)' }}>🐈</span>
                  <span className="sticker-cute text-3xl" style={{ left: '40px', bottom: '40px', transform: 'rotate(15deg)' }}>☕</span>
                </div>
                <div className="page-shading" />
              </div>
            </div>

            {/* Back: Page 3 (Summer Checklist) */}
            <div className="page-face face-back">
              <div className="notebook-page">
                <div className="diary-date">Checklist</div>
                <div className="diary-text">
                  <h3 className="font-semibold text-[#8c7355] text-lg mb-2">Summer Wishlist 🌸</h3>
                  <ul className="cute-todo-list">
                    <li>Read at least 5 books 📖</li>
                    <li>Visit the botanical gardens 🌸</li>
                    <li>Learn watercolor painting 🎨</li>
                    <li>Build beautiful React animations 💻</li>
                    <li>Bake a strawberry shortcake 🍰</li>
                  </ul>
                  
                  <span className="sticker-cute text-4xl" style={{ right: '40px', bottom: '30px', transform: 'rotate(5deg)' }}>☘️</span>
                </div>
                <div className="page-shading" />
              </div>
            </div>
          </div>

          {/* CARD 2: Page 4 / Page 5 */}
          <div
            className={`page-card ${currentPage > 2 ? "flipped-card" : ""}`}
            style={{ zIndex: getZIndex(2) }}
            onClick={() => (currentPage > 2 ? flipLeft() : flipRight())}
          >
            {/* Front: Page 4 (Watercolor Quote) */}
            <div className="page-face">
              <div className="notebook-page" style={{ background: 'linear-gradient(135deg, #fdfaf2 40%, #fff0f0 100%)' }}>
                {currentPage === 2 && (
                  <div className="spine-spiral-rings">
                    <div className="spiral-ring" />
                    <div className="spiral-ring" />
                    <div className="spiral-ring" />
                    <div className="spiral-ring" />
                    <div className="spiral-ring" />
                    <div className="spiral-ring" />
                    <div className="spiral-ring" />
                  </div>
                )}
                
                <div className="diary-date">Inspiration</div>
                <div className="diary-text flex flex-col justify-center items-center text-center px-4" style={{ height: '80%' }}>
                  <span className="text-4xl mb-4 text-[#c97b63]">“</span>
                  <p className="text-2xl font-bold italic text-[#6e5d4f]" style={{ fontFamily: 'var(--heading)' }}>
                    Write your own story, page by page.
                  </p>
                  <p className="text-lg mt-2 text-[#8c7355] italic">Make it count, make it beautiful.</p>
                  <span className="text-4xl mt-2 text-[#c97b63]">”</span>
                  
                  <div className="washi-tape" style={{ bottom: '20px', transform: 'rotate(2deg)', background: '#d1ecf1', width: '120px', textAlign: 'center' }}>
                    Keep Writing ✍️
                  </div>
                </div>
                <div className="page-shading" />
              </div>
            </div>

            {/* Back: Page 5 (Sticker Album) */}
            <div className="page-face face-back">
              <div className="notebook-page">
                <div className="diary-date">Sticker Board</div>
                <div className="diary-text">
                  <h3 className="font-semibold text-[#8c7355] text-lg mb-4 text-center">My Sticker Collection</h3>
                  
                  <div className="grid grid-cols-3 gap-6 mt-6 justify-items-center">
                    <span className="sticker-cute text-4xl static hover:scale-125 transition">🧸</span>
                    <span className="sticker-cute text-4xl static hover:scale-125 transition">🎨</span>
                    <span className="sticker-cute text-4xl static hover:scale-125 transition">🦋</span>
                    <span className="sticker-cute text-4xl static hover:scale-125 transition">🍨</span>
                    <span className="sticker-cute text-4xl static hover:scale-125 transition">💌</span>
                    <span className="sticker-cute text-4xl static hover:scale-125 transition">🌟</span>
                  </div>
                  
                  <div className="washi-tape" style={{ bottom: '35px', left: '30%', transform: 'rotate(-4deg)', background: '#e2e3e5' }}>
                    Sticker Factory 🏭
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
            onClick={() => (currentPage > 3 ? flipLeft() : flipRight())}
          >
            {/* Front: Page 6 (Final Entry & Sign-off) */}
            <div className="page-face">
              <div className="notebook-page">
                {currentPage === 3 && (
                  <div className="spine-spiral-rings">
                    <div className="spiral-ring" />
                    <div className="spiral-ring" />
                    <div className="spiral-ring" />
                    <div className="spiral-ring" />
                    <div className="spiral-ring" />
                    <div className="spiral-ring" />
                    <div className="spiral-ring" />
                  </div>
                )}
                
                <div className="diary-date">June 20, 2026</div>
                <div className="diary-text">
                  <p>Goodnight,</p>
                  <p className="mt-2">
                    It's late at night, and the stars are shining outside. The room is quiet, and the gentle hum of my PC is the only sound. 
                  </p>
                  <p className="mt-2">
                    It's time to close the diary pages for today. Talk to you tomorrow, dear diary.
                  </p>
                  <p className="mt-8 text-right font-bold text-xl text-[#c97b63]">
                    Mayesha ✍️ ❤️
                  </p>
                  
                  <span className="sticker-cute text-3xl" style={{ left: '35px', bottom: '45px', transform: 'rotate(-5deg)' }}>🌙</span>
                </div>
                <div className="page-shading" />
              </div>
            </div>

            {/* Back: Back Cover */}
            <div className="page-face face-back leather-cover">
              <div className="cover-corner corner-tl" />
              <div className="cover-corner corner-tr" />
              <div className="cover-corner corner-bl" />
              <div className="cover-corner corner-br" />
              
              <div className="cover-title-group" style={{ marginTop: '45%' }}>
                <span className="text-4xl opacity-40">⚜️</span>
              </div>
              <p className="text-xs text-[#ffe494] opacity-30 mt-auto uppercase tracking-wider">Dear Diary Back Cover</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
