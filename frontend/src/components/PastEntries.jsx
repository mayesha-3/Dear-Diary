import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api';
import './css/Calendar.css';

/* ─────────────────────────────────────────────────────────── */
/*  Constants & helpers                                        */
/* ─────────────────────────────────────────────────────────── */

const ASSET_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/api\/?$/, '');

function resolveUrl(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${ASSET_BASE}${url}`;
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

/** Returns "YYYY-MM-DD" for a Date object in local time */
function toLocalDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Pretty format for the POTD date line */
function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

/** Year options: current year ± 5 */
function yearRange() {
  const now = new Date().getFullYear();
  const years = [];
  for (let y = now - 5; y <= now + 1; y++) years.push(y);
  return years;
}

/* ─────────────────────────────────────────────────────────── */
/*  Component                                                  */
/* ─────────────────────────────────────────────────────────── */

export default function PastEntries() {
  const navigate = useNavigate();
  const today = new Date();

  /* ── Calendar navigation state ─────────────── */
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  /* ── Data state ─────────────────────────────── */
  const [allEntries, setAllEntries] = useState([]); // full list (up to 500)
  const [picOfDay,   setPicOfDay]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  /* ── Load all entries once ───────────────────── */
  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch up to 500 entries so we can show all months without re-fetching
      const res = await api.get('/entries', { params: { page: 1, limit: 500 } });
      setAllEntries(res.data.entries || []);
    } catch (err) {
      console.error(err);
      setError('Could not load your entries. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPicOfDay = useCallback(async () => {
    try {
      const res = await api.get('/entries/pic-of-the-day');
      setPicOfDay(res.data.picOfTheDay);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => {
    loadAll();
    loadPicOfDay();
  }, [loadAll, loadPicOfDay]);

  /* ── Build a lookup: "YYYY-MM-DD" → entry ────── */
  const entryByDate = useMemo(() => {
    const map = {};
    allEntries.forEach(e => {
      const key = toLocalDateKey(new Date(e.entryDate));
      // keep the first/most-recent entry for a given date
      if (!map[key]) map[key] = e;
    });
    return map;
  }, [allEntries]);

  /* ── Build calendar grid for the current view ── */
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [];

    // Leading empty cells
    for (let i = 0; i < firstDay; i++) cells.push(null);

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      cells.push({ day: d, key, entry: entryByDate[key] || null });
    }
    return cells;
  }, [viewYear, viewMonth, entryByDate]);

  /* ── Nav helpers ─────────────────────────────── */
  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const todayKey = toLocalDateKey(today);

  /* ─────────────────────────────────────────────── */
  /*  Render                                         */
  /* ─────────────────────────────────────────────── */
  return (
    <main className="cal-page">

      {/* ── Top header ──────────────────────────── */}
      <div className="cal-header">
        <h1>My Diary</h1>
        <Link to="/new" className="cal-new-btn">✎ New Entry</Link>
      </div>

      {/* ── Pic of the Day ──────────────────────── */}
      {picOfDay && (
        <section className="cal-potd">
          <span className="cal-potd-badge">📸 Pic of the Day</span>
          <img
            className="cal-potd-img"
            src={resolveUrl(picOfDay.imageUrl)}
            alt={picOfDay.entryTitle}
          />
          <div className="cal-potd-info">
            <h3>{picOfDay.entryTitle}</h3>
            <p>{formatDate(picOfDay.entryDate)}</p>
            <Link className="cal-potd-link" to={`/entry/${picOfDay.entryId}`}>
              Read full entry →
            </Link>
          </div>
        </section>
      )}

      {/* ── Month / Year navigator ──────────────── */}
      <div className="cal-nav">
        <button
          className="cal-nav-arrow"
          onClick={prevMonth}
          aria-label="Previous month"
          id="cal-prev-month"
        >‹</button>

        <div className="cal-selects">
          <select
            id="cal-month-select"
            className="cal-select"
            value={viewMonth}
            onChange={e => setViewMonth(Number(e.target.value))}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>

          <select
            id="cal-year-select"
            className="cal-select"
            value={viewYear}
            onChange={e => setViewYear(Number(e.target.value))}
          >
            {yearRange().map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <button
          className="cal-nav-arrow"
          onClick={nextMonth}
          aria-label="Next month"
          id="cal-next-month"
        >›</button>
      </div>

      {/* ── Loading / Error states ───────────────── */}
      {loading && <p className="cal-status">Loading your diary...</p>}
      {error   && <p className="cal-status error">{error}</p>}

      {!loading && !error && (
        <>
          {/* ── Weekday headers ───────────────────── */}
          <div className="cal-weekdays">
            {WEEKDAYS.map(d => (
              <div key={d} className="cal-weekday">{d}</div>
            ))}
          </div>

          {/* ── Calendar grid ─────────────────────── */}
          <div className="cal-grid" role="grid" aria-label="Diary calendar">
            {calendarDays.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="cal-day empty-day" aria-hidden="true" />;
              }

              const { day, key, entry } = cell;
              const isToday = key === todayKey;
              const imgUrl  = entry?.picOfTheDay?.imageUrl
                ? resolveUrl(entry.picOfTheDay.imageUrl)
                : null;

              const classes = [
                'cal-day',
                entry   ? 'has-entry' : '',
                isToday ? 'today'     : '',
              ].filter(Boolean).join(' ');

              return (
                <div
                  key={key}
                  id={`cal-day-${key}`}
                  className={classes}
                  role={entry ? 'button' : 'gridcell'}
                  tabIndex={entry ? 0 : -1}
                  aria-label={entry ? `${day}: ${entry.title}` : `${day}`}
                  onClick={() => entry && navigate(`/entry/${entry._id}`)}
                  onKeyDown={e => e.key === 'Enter' && entry && navigate(`/entry/${entry._id}`)}
                >
                  {/* Background image (pic of the day) */}
                  {imgUrl && (
                    <>
                      <div
                        className="cal-day-bg"
                        style={{ backgroundImage: `url(${imgUrl})` }}
                      />
                      <div className="cal-day-overlay" />
                    </>
                  )}

                  {/* Day number */}
                  <span className="cal-day-num">{day}</span>

                  {/* Entry indicator dots */}
                  {entry && (
                    <div className="cal-entry-dot">
                      <span />
                    </div>
                  )}

                  {/* Hover tooltip */}
                  {entry && (
                    <div className="cal-day-tooltip">
                      {entry.title}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Empty month message ───────────────── */}
          {calendarDays.every(c => !c?.entry) && (
            <p className="cal-status" style={{ marginTop: '2rem' }}>
              No entries for {MONTHS[viewMonth]} {viewYear} —{' '}
              <Link to="/new" style={{ color: '#c97b63', fontWeight: 700 }}>
                write one now!
              </Link>
            </p>
          )}
        </>
      )}
    </main>
  );
}
