import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import { auth } from "../firebase";

import DesertVoyage from "../assets/Music/Desert Voyage.mp3";
import MoonlightOrchestra from "../assets/Music/Moonlight Orchestra.mp3";
import PeacefulPiano from "../assets/Music/Peaceful Piano.mp3";

const MUSIC_TRACKS: Record<string, string> = {
  DesertVoyage: DesertVoyage,
  MoonlightOrchestra: MoonlightOrchestra,
  PeacefulPiano: PeacefulPiano,
};

const STORAGE_KEY = "deardiary-settings-v1";

function Header() {
  const user = auth.currentUser;
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const displayName =
    user?.displayName || user?.email?.split("@")[0] || "Diary Owner";

  const syncSettings = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSettings(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    window.addEventListener("diary-settings-updated", syncSettings);
    window.addEventListener("storage", syncSettings);
    return () => {
      window.removeEventListener("diary-settings-updated", syncSettings);
      window.removeEventListener("storage", syncSettings);
    };
  }, []);

  // Audio control logic
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!settings || !settings.musicEnabled || settings.musicMode === "off") {
      audio.pause();
      return;
    }

    const trackSrc = MUSIC_TRACKS[settings.musicMode];
    if (trackSrc) {
      if (audio.src !== trackSrc) {
        audio.src = trackSrc;
      }
      audio.loop = true;
      audio.play().catch((err) => {
        console.warn("Audio playback issue:", err);
      });
    } else {
      audio.pause();
    }
  }, [settings?.musicEnabled, settings?.musicMode]);

  const updateSetting = (key: string, value: any) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("diary-settings-updated"));
  };

  return (
    <>
      <audio ref={audioRef} preload="auto" />

      <header
        className="transition-colors duration-300"
        style={{
          background: "var(--surface-2)",
          borderBottom: "1px solid var(--border)",
        }}>
        <div className="p-4 flex items-center justify-between w-full">
          <div className="flex items-center gap-4 p-2">
            <div
              className="relative w-[5vw] h-[5vw] min-w-[50px] min-h-[50px] rounded-full overflow-hidden transition-all duration-300"
              style={{ background: "var(--surface-3)" }}>
              <img
                src="/src/assets/dp.png"
                alt="Profile"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
                }}
                className="absolute p-3 inset-0 w-full h-full object-cover"
              />
              <img
                src="/src/assets/vectorO.png"
                alt="Frame"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
            </div>
            <div>
              <p
                className="font-semibold"
                style={{ color: "var(--text-h)", fontFamily: "var(--sans)" }}>
                {displayName}
              </p>
            </div>
          </div>
          <div>
            <Link to="/">
              <img
                className="h-[12vh]"
                src="/src/assets/logo1.png"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "src/assets/logo1.png";
                }}
                alt="My Dear Diary"
              />
            </Link>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setDrawerOpen((prev) => !prev)}
              className="rounded-full p-2 transition-all duration-300 hover:scale-105 border"
              style={{
                background: "var(--surface-3)",
                borderColor: "var(--border)",
              }}
              aria-label="Open quick settings">
              <img
                src="/src/assets/hamburg.png"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "src/assets/hamburg.png";
                }}
                alt=""
                className="w-[4vw] h-[4vw] min-w-[30px] min-h-[30px] rounded-full"
              />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-3 px-6 py-3">
          <Link
            to="/entries"
            className="px-3 py-2 rounded transition duration-150 hover:opacity-80"
            style={{ color: "var(--text-muted)" }}>
            Past Entries
          </Link>
          <Link
            to="/new"
            className="px-3 py-2 rounded transition duration-150 hover:opacity-80"
            style={{ color: "var(--text-muted)" }}>
            New Entry
          </Link>
          <Link
            to="/stickers"
            className="px-3 py-2 rounded transition duration-150 hover:opacity-80"
            style={{ color: "var(--text-muted)" }}>
            Sticker Factory
          </Link>
          <Link
            to="/scan"
            className="px-3 py-2 rounded transition duration-150 hover:opacity-80"
            style={{ color: "var(--text-muted)" }}>
            Scan Diary
          </Link>
          <Link
            to="/settings"
            className="px-3 py-2 rounded transition duration-150 hover:opacity-80"
            style={{ color: "var(--text-muted)" }}>
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded transition duration-150 hover:opacity-80"
            style={{ color: "#ff6b6b" }}>
            Sign Out
          </button>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 transition-all duration-300 ${
          drawerOpen ? "bg-black/40 pointer-events-auto" : "pointer-events-none"
        }`}
        onClick={() => setDrawerOpen(false)}>
        <div
          className={`absolute right-0 top-0 h-full w-[320px] max-w-[90vw] border-l p-5 shadow-2xl backdrop-blur transition-transform duration-300 ${
            drawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
          style={{
            background: "var(--surface-2)",
            borderColor: "var(--border)",
          }}
          onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between">
            <h3
              className="text-lg font-semibold"
              style={{ color: "var(--text-h)" }}>
              Quick Controls
            </h3>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="rounded-full border px-3 py-1 text-sm transition"
              style={{
                background: "var(--surface-3)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}>
              Close
            </button>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <label
                className="mb-2 block text-sm font-medium"
                style={{ color: "var(--text-h)" }}>
                Brightness
              </label>
              <input
                type="range"
                min="60"
                max="140"
                value={settings?.brightness ?? 100}
                onChange={(e) =>
                  updateSetting("brightness", Number(e.target.value))
                }
                className="w-full accent-[#5b7cff]"
              />
              <p
                className="mt-1 text-sm"
                style={{ color: "var(--text-muted)" }}>
                {settings?.brightness ?? 100}%
              </p>
            </div>

            <div>
              <label
                className="mb-2 block text-sm font-medium"
                style={{ color: "var(--text-h)" }}>
                Music
              </label>
              <select
                value={settings?.musicEnabled ? settings?.musicMode : "off"}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "off") {
                    updateSetting("musicEnabled", false);
                  } else {
                    updateSetting("musicEnabled", true);
                    updateSetting("musicMode", val);
                  }
                }}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{
                  background: "var(--surface-3)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}>
                <option value="PeacefulPiano">Peaceful Piano</option>
                <option value="MoonlightOrchestra">Moonlight Orchestra</option>
                <option value="DesertVoyage">Desert Voyage</option>
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
