import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api';

const ASSET_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

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

export default function PastEntries() {
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [picOfDay, setPicOfDay] = useState(null);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const loadEntries = useCallback(async (pageToLoad, searchTerm) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/entries', {
        params: { page: pageToLoad, limit: 10, search: searchTerm || undefined },
      });
      setEntries(res.data.entries);
      setTotalPages(res.data.totalPages);
      setPage(res.data.page);
    } catch (err) {
      console.error(err);
      setErrorMsg('Could not load your past entries. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPicOfDay = useCallback(async () => {
    try {
      const res = await api.get('/entries/pic-of-the-day');
      setPicOfDay(res.data.picOfTheDay);
    } catch (err) {
      // Non-critical — fail quietly so it doesn't block the page
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadEntries(1, '');
    loadPicOfDay();
  }, [loadEntries, loadPicOfDay]);

  const handleSearchSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setSearch(searchInput);
      loadEntries(1, searchInput);
    },
    [searchInput, loadEntries]
  );

  const handleClearSearch = useCallback(() => {
    setSearchInput('');
    setSearch('');
    loadEntries(1, '');
  }, [loadEntries]);

  const goToPage = useCallback(
    (nextPage) => {
      if (nextPage < 1 || nextPage > totalPages) return;
      loadEntries(nextPage, search);
    },
    [loadEntries, search, totalPages]
  );

  const handleDelete = useCallback(
    async (entryId) => {
      const confirmed = window.confirm('Delete this entry? This cannot be undone.');
      if (!confirmed) return;

      setDeletingId(entryId);
      try {
        await api.delete(`/entries/${entryId}`);
        setEntries((prev) => prev.filter((e) => e._id !== entryId));
      } catch (err) {
        console.error(err);
        setErrorMsg('Failed to delete entry.');
      } finally {
        setDeletingId(null);
      }
    },
    []
  );

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Past Entries</h1>

      {/* New Entry Button */}
      <Link to="/new" className="inline-block px-6 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 mb-6">
        ✎ New Entry
      </Link>

      {/* Pic of the Day */}
      {picOfDay && (
        <section className="bg-gradient-to-r from-purple-100 to-blue-100 p-6 rounded-lg mb-6">
          <h2 className="text-2xl font-semibold mb-4">Pic of the Day</h2>
          <div className="flex gap-4">
            <img src={resolveAssetUrl(picOfDay.imageUrl)} alt="Pic of day" className="w-48 h-48 object-cover rounded" />
            <div>
              <p className="text-gray-700 mb-2">
                <strong>{picOfDay.entryTitle}</strong>
              </p>
              <p className="text-sm text-gray-600 mb-4">{formatDate(picOfDay.entryDate)}</p>
              <Link
                to={`/entry/${picOfDay.entryId}`}
                className="text-blue-600 hover:underline"
              >
                Read full entry →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="mb-6 flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search entries..."
          className="flex-1 px-4 py-2 border rounded"
        />
        <button type="submit" className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
          >
            Clear
          </button>
        )}
      </form>

      {errorMsg && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{errorMsg}</div>}

      {/* Entries List */}
      {loading ? (
        <p className="text-gray-600">Loading entries...</p>
      ) : entries.length === 0 ? (
        <p className="text-gray-600">No entries found. Start writing your first entry!</p>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry._id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-blue-600 hover:text-blue-800">
                    <Link to={`/entry/${entry._id}`}>{entry.title}</Link>
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">{formatDate(entry.entryDate)}</p>
                  <p className="text-gray-700">{entry.excerpt}</p>
                </div>
                {entry.picOfTheDay?.imageUrl && (
                  <img
                    src={resolveAssetUrl(entry.picOfTheDay.imageUrl)}
                    alt={entry.title}
                    className="w-20 h-20 object-cover rounded ml-4"
                  />
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <Link
                  to={`/entry/${entry._id}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Read More
                </Link>
                <button
                  onClick={() => handleDelete(entry._id)}
                  disabled={deletingId === entry._id}
                  className="text-red-600 hover:underline text-sm disabled:text-gray-400"
                >
                  {deletingId === entry._id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-300 rounded disabled:bg-gray-200"
          >
            ← Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages}
            className="px-4 py-2 bg-gray-300 rounded disabled:bg-gray-200"
          >
            Next →
          </button>
        </div>
      )}
    </main>
  );
}
