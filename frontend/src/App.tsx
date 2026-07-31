import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./firebase";
import Header from "./components/Header";
import Footer from "./components/Footer";
import BookDupe from "./components/BookDupe";
import NewEntry from "./components/NewEntry";
import PastEntries from "./components/PastEntries";
import EntryView from "./components/EntryView";
import StickerFactory from "./components/StickerFactory";
import SettingsPage from "./components/SettingsPage";
import ScanDiaryPage from "./components/ScanDiaryPage";
import Auth from "./components/Auth";

function Home() {
  return (
    <main className="p-4 md:p-8 text-[var(--text)]">
      <p className="text-lg max-w-2xl leading-relaxed text-[var(--text-muted)]">
        Welcome to Dear Diary, your personal journaling app. <br />
        Write all your thoughts, feelings, and experiences in a safe and private space.
      </p>
      <br />
      <br />
      <br />
      <div className="flex justify-center self-center pl-[200px]">
        <BookDupe />
      </div>
    </main>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #07111f 0%, #0d1830 45%, #111c32 100%)',
          color: 'var(--text)',
          fontFamily: 'var(--heading)'
        }}
      >
        <div className="text-center px-6">
          <h2 className="text-3xl animate-pulse" style={{ color: 'var(--text-h)' }}>Opening diary pages...</h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'transparent', color: 'var(--text)' }}>
      <BrowserRouter>
        <Header />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/new" element={<NewEntry />} />
            <Route path="/entries" element={<PastEntries />} />
            <Route path="/stickers" element={<StickerFactory />} />
            <Route path="/scan" element={<ScanDiaryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/entry/:id" element={<EntryView />} />
          </Routes>
        </div>
        <Footer />
      </BrowserRouter>
    </div>
  );
}

export default App;
