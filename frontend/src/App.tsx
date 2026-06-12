import React, { useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import BookDupe from "./components/BookDupe";
import NewEntry from "./components/NewEntry";
import PastEntries from "./components/PastEntries";
import EntryView from "./components/EntryView";

function Home() {
  return (
    <main className="p-4">
      <p className="text-lg text-gray-700">
        Welcome to Dear Diary, your personal journaling app. Start writing your
        thoughts and memories today!
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
  const [open, setOpen] = useState<string | null>(null);

  const toggle = (section: string) => {
    setOpen(open === section ? null : section);
  };

  return (
    <>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<NewEntry />} />
          <Route path="/entries" element={<PastEntries />} />
          <Route path="/entry/:id" element={<EntryView />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </>
  );
}

export default App;
