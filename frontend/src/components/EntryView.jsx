import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/api';

const ASSET_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5100/api').replace(/\/api\/?$/, '');

function resolveAssetUrl(url) {
  if (!url) return url;
  return url.startsWith('http') ? url : `${ASSET_BASE_URL}${url}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function EntryView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadEntry() {
      setLoading(true);
      setErrorMsg('');
      try {
        const res = await api.get(`/entries/${id}`);
        if (!cancelled) setEntry(res.data.entry);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setErrorMsg(
            err.response?.status === 404
              ? 'This entry could not be found.'
              : 'Could not load this entry. Please try again.'
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
        <p role="alert" className="text-red-600">{errorMsg || 'Entry not found.'}</p>
        <Link to="/entries" className="text-blue-600 hover:underline mt-4 block">
          Back to Past Entries
        </Link>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-6">
      <section>
        <nav className="mb-6">
          <Link to="/entries" className="text-blue-600 hover:underline">
            ← Back to Past Entries
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
            <time dateTime={entry.entryDate}>{formatDate(entry.entryDate)}</time>
          </p>
        </header>

        {/* ------------------------------------------------------ */}
        {/* Rich text content                                       */}
        {/* ------------------------------------------------------ */}
        <article
          className="prose prose-lg max-w-none mb-6 text-gray-800"
          dangerouslySetInnerHTML={{ __html: entry.content }}
        />

        {/* ------------------------------------------------------ */}
        {/* Stickers                                                */}
        {/* ------------------------------------------------------ */}
        {entry.stickers && entry.stickers.length > 0 && (
          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Stickers</h2>
            <div className="relative w-full bg-gray-50 border-2 border-gray-300 rounded p-4" style={{ minHeight: '300px' }}>
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
                  }}
                >
                  <img
                    src={resolveAssetUrl(sticker.imageUrl)}
                    alt="sticker"
                    className="w-full h-auto pointer-events-none"
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
