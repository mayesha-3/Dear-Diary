import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

function Home() {
  return (
    <main className="p-4">
      <p className="text-lg text-gray-700">
        Welcome to Dear Diary, your personal journaling app. <br />
        Write all your thoughts, feelings, and experiences in a safe and private
        space.
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
          background:
            "repeating-linear-gradient(to bottom, #fffdf8, #fffdf8 28px, #e1e1e1 29px)",
          fontFamily: "var(--heading)",
        }}>
        <div className="text-center">
          <h2 className="text-3xl text-[#4a3c2a] animate-pulse">
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
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<NewEntry />} />
          <Route path="/entries" element={<PastEntries />} />
          <Route path="/stickers" element={<StickerFactory />} />
          <Route path="/entry/:id" element={<EntryView />} />
          <Route path="/edit/:id" element={<EditEntry />} />
          <Route path="/scan" element={<ScanDiaryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </>
  );
}

export default App;
