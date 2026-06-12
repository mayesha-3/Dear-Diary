import "./App.css";
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
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
        Welcome to Dear Diary, your personal journaling app. Start writing
        your thoughts and memories today!
      </p>
      <br /><br /><br />
      <div className="flex justify-center self-center pl-[200px]">
        <BookDupe />
      </div>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/new" element={<NewEntry />} />
        <Route path="/entries" element={<PastEntries />} />
        <Route path="/entry/:id" element={<EntryView />} />
      </Routes>

      {/* Joynab starts here 
      Footer banabi, try korbi accoddion effect diye footer er about us, contact etc open hoy emon korte*/}
      <Footer />
    </BrowserRouter>
  );
}

export default App;
