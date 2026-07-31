import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth } from '../firebase';

function Header() {
  const user = auth.currentUser;
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [music, setMusic] = useState('piano');

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Diary Owner';

  useEffect(() => {
    const savedBrightness = Number(localStorage.getItem('diary-brightness') || 100);
    const savedMusic = localStorage.getItem('diary-music') || 'piano';
    setBrightness(savedBrightness);
    setMusic(savedMusic);
  }, []);

  useEffect(() => {
    localStorage.setItem('diary-brightness', String(brightness));
    document.documentElement.style.filter = `brightness(${brightness / 100})`;

    return () => {
      document.documentElement.style.filter = '';
    };
  }, [brightness]);

  useEffect(() => {
    localStorage.setItem('diary-music', music);
  }, [music]);

  return (
    <>
      <header style={{ background: 'linear-gradient(90deg, rgba(17, 28, 50, 0.96), rgba(30, 49, 81, 0.96))', borderBottom: '1px solid var(--border)' }}>
        <div className="p-4 flex items-center justify-between w-full">
          <div className="flex items-center gap-4 p-2">
            <div className="relative w-[5vw] h-[5vw] min-w-[50px] min-h-[50px] rounded-full overflow-hidden transition-all duration-300" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <img
                src="/src/assets/dp.png"
                alt="Profile"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
                }}
                className="absolute p-3 inset-0 w-full h-full object-cover"
              />
              <img
                src="/src/assets/vectorO.png"
                alt="Frame"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--sans)' }}>{displayName}</p>
            </div>
          </div>
          <div>
            <Link to="/">
              <img
                className="h-[12vh]"
                src="/src/assets/logo1.png"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'src/assets/logo1.png';
                }}
                alt="My Dear Diary"
              />
            </Link>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setDrawerOpen((prev) => !prev)}
              className="rounded-full p-2 transition-all duration-300 hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.08)' }}
              aria-label="Open quick settings"
            >
              <img
                src="/src/assets/hamburg.png"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'src/assets/hamburg.png';
                }}
                alt=""
                className="w-[4vw] h-[4vw] min-w-[30px] min-h-[30px] pd-4 rounded-full"
              />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-3 px-6 py-3">
          <Link to="/entries" className="px-3 py-2 rounded transition duration-150" style={{ color: 'var(--text-muted)' }}>
            Past Entries
          </Link>
          <Link to="/new" className="px-3 py-2 rounded transition duration-150" style={{ color: 'var(--text-muted)' }}>
            New Entry
          </Link>
          <Link to="/stickers" className="px-3 py-2 rounded transition duration-150" style={{ color: 'var(--text-muted)' }}>
            Sticker Factory
          </Link>
          <Link to="/scan" className="px-3 py-2 rounded transition duration-150" style={{ color: 'var(--text-muted)' }}>
            Scan Diary
          </Link>
          <Link to="/settings" className="px-3 py-2 rounded transition duration-150" style={{ color: 'var(--text-muted)' }}>
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded transition duration-150"
            style={{ color: '#ffb3b3' }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 transition-all duration-300 ${drawerOpen ? 'bg-black/40 pointer-events-auto' : 'pointer-events-none'}`}
        onClick={() => setDrawerOpen(false)}
      >
        <div
          className={`absolute right-0 top-0 h-full w-[320px] max-w-[90vw] border-l border-white/10 bg-slate-900/95 p-5 shadow-2xl backdrop-blur transition-transform duration-300 ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-h)' }}>
              Quick Controls
            </h3>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-300"
            >
              Close
            </button>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-h)' }}>
                Brightness
              </label>
              <input
                type="range"
                min="60"
                max="140"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full accent-sky-400"
              />
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                {brightness}%
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--text-h)' }}>
                Music
              </label>
              <select
                value={music}
                onChange={(e) => setMusic(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-slate-100"
              >
                <option value="piano">Piano</option>
                <option value="jazz">Jazz</option>
                <option value="nature">Relaxing Nature</option>
                <option value="off">Off</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Header;
