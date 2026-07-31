import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/api";

const ASSET_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5001/api"
).replace(/\/api\/?$/, "");

function resolveAssetUrl(url) {
  if (!url) return url;
  return url.startsWith("http") ? url : `${ASSET_BASE_URL}${url}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function EntryView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadEntry() {
      setLoading(true);
      setErrorMsg("");
      try {
        const res = await api.get(`/entries/${id}`);
        if (!cancelled) setEntry(res.data.entry);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setErrorMsg(
            err.response?.status === 404
              ? "This entry could not be found."
              : "Could not load this entry. Please try again.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadEntry();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="container mx-auto p-6">
        <p>Loading entry…</p>
      </main>
    );
  }

  if (errorMsg || !entry) {
    return (
      <main className="container mx-auto p-6">
        <p role="alert" className="text-red-600">
          {errorMsg || "Entry not found."}
        </p>
        <Link to="/entries" className="text-[#c97b63] hover:underline mt-4 block">
          Back to Past Entries
        </Link>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-6">
      <section>
        <nav className="mb-6 flex justify-between items-center">
          <Link to="/entries" className="text-[#c97b63] hover:underline">
            ← Back to Past Entries
          </Link>
          <Link
            to={`/edit/${entry._id}`}
            className="px-4 py-2 bg-gray-900 text-white rounded font-semibold hover:bg-gray-700">
            Edit Entry
          </Link>
        </nav>

        {/* ------------------------------------------------------ */}
        {/* Pic of the day                                          */}
        {/* ------------------------------------------------------ */}
        {entry.picOfTheDay?.enabled && entry.picOfTheDay?.imageUrl && (
          <section className="mb-6">
            <h2 className="text-2xl font-semibold mb-4">Pic of the Day</h2>
            <img
              src={resolveAssetUrl(entry.picOfTheDay.imageUrl)}
              alt={`Pic of the day for ${entry.title}`}
              className="w-80 h-auto rounded"
            />
          </section>
        )}

        <header className="mb-6">
          <h1 className="text-4xl font-bold mb-2">{entry.title}</h1>
          <p className="text-gray-600">
            <time dateTime={entry.entryDate}>
              {formatDate(entry.entryDate)}
            </time>
          </p>
          {(entry.mood || entry.activity) && (
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-700">
              {entry.mood && (
                <span className="px-3 py-1 bg-yellow-100 rounded-full">
                  Mood: {entry.mood}
                </span>
              )}
              {entry.activity && (
                <span className="px-3 py-1 bg-slate-100 rounded-full">
                  Activity: {entry.activity}
                </span>
              )}
            </div>
          )}
        </header>

        {/* ------------------------------------------------------ */}
        {/* Rich text content with stickers behind                  */}
        {/* ------------------------------------------------------ */}
        <div className="relative w-full">
          {/* Stickers behind */}
          {entry.stickers && entry.stickers.length > 0 && (
            <div className="absolute inset-0 pointer-events-none z-0">
              {entry.stickers.map((sticker) => (
                <div
                  key={sticker.stickerId}
                  className="absolute"
                  style={{
                    left: `${sticker.x}%`,
                    top: `${sticker.y}%`,
                    width: `${sticker.width}px`,
                    transform: `translateX(-50%) translateY(-50%) rotate(${sticker.rotation}deg)`,
                    zIndex: sticker.zIndex,
                    opacity: 0.9,
                  }}>
                  <img
                    src={resolveAssetUrl(sticker.imageUrl)}
                    alt="sticker"
                    className="w-full h-auto pointer-events-none"
                  />
                </div>
              ))}
            </div>
          )}

          <article
            className="prose prose-lg max-w-none mb-6 text-gray-800 relative z-10 p-4 rounded min-h-[300px]"
            dangerouslySetInnerHTML={{ __html: entry.content }}
          />
        </div>
      </section>
    </main>
  );
}
