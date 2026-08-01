import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./firebase";
import Header from "./components/Header";
import Footer from "./components/Footer";
import BookDupe from "./components/BookDupe";
import NewEntry from "./components/NewEntry";
import EditEntry from "./components/EditEntry";
import PastEntries from "./components/PastEntries";
import EntryView from "./components/EntryView";
import StickerFactory from "./components/StickerFactory";
import Auth from "./components/Auth";
import ScanDiaryPage from "./components/ScanDiaryPage";
import SettingsPage from "./components/SettingsPage";
import { GlobalAudio } from "./components/GlobalAudio";
import api from "./api/api";
import AdminPanel from "./components/AdminPanel";

// Background Assets
import BGLight from "./assets/BGLight.png";
import BGDark from "./assets/BGDark.png";

function Home() {
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    // Listen for theme toggle on <html> element
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <main
      style={{
        backgroundImage: `url(${isDark ? BGDark : BGLight})`,
      }}
      className="relative min-h-[calc(100vh-140px)] px-4 py-8 overflow-x-hidden flex flex-col items-center justify-between bg-cover bg-center bg-no-repeat transition-all duration-500">
      {/* Ambient Radial Accent Glow: Adapted for Royal Blue (Dark) vs Ivory (Light) */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full blur-[130px] opacity-25 -z-10 transition-all duration-500"
        style={{
          background: isDark
            ? "radial-gradient(circle, #2563eb 0%, #1e3a8a 50%, transparent 100%)" // Royal Blue / Sapphire glow
            : "radial-gradient(circle, #f3d5b5 0%, #e7bc91 50%, transparent 100%)", // Warm Ivory glow
        }}
      />

      {/* Hero Welcome Banner */}
      <div className="text-center max-w-2xl mx-auto mb-6 space-y-3">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-medium tracking-widest uppercase shadow-xs transition-transform hover:scale-105"
          style={{
            background: "var(--surface-2)",
            borderColor: "var(--border)",
            color: isDark ? "#93c5fd" : "var(--accent-2)",
          }}>
          <span>✨</span> Your Sacred Sanctuary
        </div>

        <h1
          className="text-4xl md:text-5xl font-serif font-semibold tracking-tight"
          style={{ color: "var(--text-h)" }}>
          Welcome Home, Writer
        </h1>

        <p
          className="text-base md:text-lg leading-relaxed max-w-xl mx-auto"
          style={{ color: "var(--text-muted)" }}>
          Unfold your quietest thoughts, cherish daily moments, and preserve
          your journey in a timeless, private aesthetic space.
        </p>
      </div>

      {/* Centerpiece 3D Interactive Diary */}
      <div className="w-full max-w-5xl my-4 flex justify-center items-center py-6">
        <BookDupe />
      </div>

      {/* Bottom Quick Action Bar */}
      <div className="mt-8 flex flex-wrap justify-center items-center gap-4">
        <Link
          to="/new"
          className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          style={{
            background: isDark ? "#2563eb" : "var(--accent-2)", // Royal blue accent in dark mode
            color: "#ffffff",
            boxShadow: isDark ? "0 4px 20px rgba(37, 99, 235, 0.3)" : "none",
          }}>
          <span>✍️</span>
          <span>Write New Entry</span>
        </Link>

        <Link
          to="/entries"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium text-sm border transition-all duration-300 hover:bg-[var(--surface-3)] hover:-translate-y-0.5"
          style={{
            background: "var(--surface-2)",
            borderColor: "var(--border)",
            color: "var(--text)",
          }}>
          <span>📖</span>
          <span>Explore Past Memories</span>
        </Link>
      </div>
    </main>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [accountStatus, setAccountStatus] = useState<{ restricted: boolean; warned: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      // fetch account status after sign-in
      if (currentUser) {
        // Ensure the backend has a User document for this firebase user
        api.post('/account/upsert').catch((e) => console.warn('Could not upsert user', e));
        api.get('/account/status').then(r => setAccountStatus(r.data)).catch(() => setAccountStatus(null));
      } else {
        setAccountStatus(null);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center dark:bg-[#0f172a] bg-[#faf6f0]"
        style={{
          fontFamily: "var(--heading)",
        }}>
        <div className="text-center">
          <h2 className="text-3xl text-[#4a3c2a] dark:text-[#93c5fd] animate-pulse font-serif">
            Opening diary pages...
          </h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <>
      <BrowserRouter>
        <GlobalAudio />
        <Header />
        {/* Global banners for warn/restricted */}
        {accountStatus?.warned && (
          <div className="w-full text-center py-3 bg-red-100 text-red-800 font-semibold">
            Your account is violating our rules. Please contact redreaster@gmail.com
          </div>
        )}
        {accountStatus?.restricted && (
          <div className="w-full text-center py-6 bg-red-600 text-white font-extrabold text-xl">
            Your account has been restricted. Please email redreaster@gmail.com
          </div>
        )}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<NewEntry />} />
          <Route path="/entries" element={<PastEntries />} />
          <Route path="/stickers" element={<StickerFactory />} />
          <Route path="/entry/:id" element={<EntryView />} />
          <Route path="/edit/:id" element={<EditEntry />} />
          <Route path="/scan/" element={<ScanDiaryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin" element={user?.email === 'redreaster@gmail.com' ? <AdminPanel /> : <div />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </>
  );
}

export default App;
