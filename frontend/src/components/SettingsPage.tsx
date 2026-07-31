import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

type ThemeMode = 'royal-dark' | 'soft-ivory';
type MusicMode = 'piano' | 'jazz' | 'nature';

type SettingsState = {
  soundEffects: boolean;
  theme: ThemeMode;
  brightness: number;
  musicEnabled: boolean;
  musicMode: MusicMode;
  autoSave: boolean;
  privateMode: boolean;
  showHints: boolean;
};

const STORAGE_KEY = 'deardiary-settings-v1';

const defaultSettings: SettingsState = {
  soundEffects: true,
  theme: 'royal-dark',
  brightness: 100,
  musicEnabled: true,
  musicMode: 'piano',
  autoSave: true,
  privateMode: true,
  showHints: true,
};

function readSettings(): SettingsState {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  if (theme === 'soft-ivory') {
    root.style.setProperty('--bg', '#f7f7f2');
    root.style.setProperty('--surface', '#fffdf8');
    root.style.setProperty('--surface-2', '#f2ebdd');
    root.style.setProperty('--surface-3', '#e5d9c3');
    root.style.setProperty('--border', '#cdbb9a');
    root.style.setProperty('--text', '#24324a');
    root.style.setProperty('--text-muted', '#50627b');
    root.style.setProperty('--text-h', '#17253b');
    root.style.setProperty('--accent', '#4b6bff');
    root.style.setProperty('--accent-strong', '#3050d8');
    root.style.setProperty('--accent-2', '#3f63bb');
  } else {
    root.style.setProperty('--bg', '#07111f');
    root.style.setProperty('--surface', '#111c32');
    root.style.setProperty('--surface-2', '#172645');
    root.style.setProperty('--surface-3', '#1e3151');
    root.style.setProperty('--border', '#2d4b7a');
    root.style.setProperty('--text', '#f6f8ff');
    root.style.setProperty('--text-muted', '#ced8ff');
    root.style.setProperty('--text-h', '#ffffff');
    root.style.setProperty('--accent', '#6f8dff');
    root.style.setProperty('--accent-strong', '#5b7cff');
    root.style.setProperty('--accent-2', '#9bb6ff');
  }
}

function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const saved = readSettings();
    setSettings(saved);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  }, [settings]);

  useEffect(() => {
    applyTheme(settings.theme);
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--brightness', `${settings.brightness}%`);
      document.documentElement.style.filter = `brightness(${settings.brightness}%)`;
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.documentElement.style.filter = '';
      }
    };
  }, [settings.theme, settings.brightness]);

  useEffect(() => {
    if (!settings.musicEnabled || !settings.musicMode) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    audioContextRef.current = audioContext;
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.05;
    gainNode.connect(audioContext.destination);
    gainNodeRef.current = gainNode;

    const playNote = (freq: number, type: OscillatorType, duration: number, gainValue: number) => {
      const oscillator = audioContext.createOscillator();
      const noteGain = audioContext.createGain(); 
      oscillator.type = type;
      oscillator.frequency.value = freq;
      noteGain.gain.value = gainValue;
      oscillator.connect(noteGain);
      noteGain.connect(gainNode);
      oscillator.start();
      noteGain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
      oscillator.stop(audioContext.currentTime + duration);
    };

    const patterns: Record<MusicMode, Array<{ freq: number; type: OscillatorType; duration: number; gainValue: number }>> = {
      piano: [
        { freq: 261.63, type: 'sine', duration: 0.8, gainValue: 0.04 },
        { freq: 329.63, type: 'sine', duration: 0.8, gainValue: 0.03 },
        { freq: 392.0, type: 'sine', duration: 0.8, gainValue: 0.03 },
      ],
      jazz: [
        { freq: 220, type: 'triangle', duration: 0.6, gainValue: 0.04 },
        { freq: 277.18, type: 'sawtooth', duration: 0.7, gainValue: 0.03 },
        { freq: 330, type: 'triangle', duration: 0.6, gainValue: 0.03 },
      ],
      nature: [
        { freq: 174.61, type: 'sine', duration: 1.2, gainValue: 0.025 },
        { freq: 196.0, type: 'sine', duration: 1.4, gainValue: 0.02 },
        { freq: 220.0, type: 'sine', duration: 1.2, gainValue: 0.02 },
      ],
    };

    const sequence = patterns[settings.musicMode];
    let step = 0;
    intervalRef.current = window.setInterval(() => {
      const note = sequence[step % sequence.length];
      playNote(note.freq, note.type, note.duration, note.gainValue);
      step += 1;
    }, 1500);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
        gainNodeRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        void audioContextRef.current.close();
      }
      audioContextRef.current = null;
    };
  }, [settings.musicEnabled, settings.musicMode]);

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <main className="min-h-screen px-4 py-8 md:px-8" style={{ color: 'var(--text)', background: 'transparent' }}>
      <div className="mx-auto max-w-5xl rounded-[32px] border p-6 shadow-2xl" style={{ background: 'rgba(17, 28, 50, 0.92)', borderColor: 'var(--border)' }}>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm uppercase tracking-[0.3em]" style={{ color: 'var(--accent-2)' }}>Personalize your space</p>
            <h1 className="text-3xl font-semibold" style={{ color: 'var(--text-h)' }}>Settings</h1>
            <p className="mt-2 max-w-2xl text-sm" style={{ color: 'var(--text-muted)' }}>
              Tailor the app experience with comfort, ambiance, and calm controls that fit your journaling flow.
            </p>
          </div>
          <Link to="/" className="rounded-full px-4 py-2 text-sm font-medium" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text)' }}>
            ← Back home
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border p-5" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'var(--border)' }}>
            <h2 className="mb-4 text-xl font-semibold" style={{ color: 'var(--text-h)' }}>Comfort & Atmosphere</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.03)' }}>
                <div>
                  <p className="font-medium">Sound effects</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Soft clicks and feedback when you interact.</p>
                </div>
                <input type="checkbox" checked={settings.soundEffects} onChange={(e) => updateSetting('soundEffects', e.target.checked)} className="h-5 w-5 accent-[#5b7cff]" />
              </label>

              <label className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.03)' }}>
                <div>
                  <p className="font-medium">Auto-save drafts</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Keep your entries safe as you type.</p>
                </div>
                <input type="checkbox" checked={settings.autoSave} onChange={(e) => updateSetting('autoSave', e.target.checked)} className="h-5 w-5 accent-[#5b7cff]" />
              </label>

              <label className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.03)' }}>
                <div>
                  <p className="font-medium">Private mode</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Add a calmer, more focused experience to the app.</p>
                </div>
                <input type="checkbox" checked={settings.privateMode} onChange={(e) => updateSetting('privateMode', e.target.checked)} className="h-5 w-5 accent-[#5b7cff]" />
              </label>

              <label className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.03)' }}>
                <div>
                  <p className="font-medium">Show hints</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Helpful tips for new diary entries and stickers.</p>
                </div>
                <input type="checkbox" checked={settings.showHints} onChange={(e) => updateSetting('showHints', e.target.checked)} className="h-5 w-5 accent-[#5b7cff]" />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border p-5" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'var(--border)' }}>
            <h2 className="mb-4 text-xl font-semibold" style={{ color: 'var(--text-h)' }}>Appearance</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Theme</label>
                <select value={settings.theme} onChange={(e) => updateSetting('theme', e.target.value as ThemeMode)} className="w-full rounded-2xl border px-3 py-2" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text)', borderColor: 'var(--border)' }}>
                  <option value="royal-dark">Royal Blue Dark</option>
                  <option value="soft-ivory">Soft Ivory</option>
                </select>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium">Brightness</label>
                  <span className="text-sm" style={{ color: 'var(--accent-2)' }}>{settings.brightness}%</span>
                </div>
                <input type="range" min="70" max="120" value={settings.brightness} onChange={(e) => updateSetting('brightness', Number(e.target.value))} className="w-full accent-[#5b7cff]" />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border p-5 lg:col-span-2" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'var(--border)' }}>
            <h2 className="mb-4 text-xl font-semibold" style={{ color: 'var(--text-h)' }}>Music & Calm</h2>
            <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                <label className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.03)' }}>
                  <div>
                    <p className="font-medium">Background music</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Gentle ambient sound while you write.</p>
                  </div>
                  <input type="checkbox" checked={settings.musicEnabled} onChange={(e) => updateSetting('musicEnabled', e.target.checked)} className="h-5 w-5 accent-[#5b7cff]" />
                </label>

                <div>
                  <label className="mb-2 block text-sm font-medium">Choose music</label>
                  <select value={settings.musicMode} onChange={(e) => updateSetting('musicMode', e.target.value as MusicMode)} className="w-full rounded-2xl border px-3 py-2" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text)', borderColor: 'var(--border)' }}>
                    <option value="piano">Piano melodies</option>
                    <option value="jazz">Warm jazz</option>
                    <option value="nature">Relaxing nature</option>
                  </select>
                </div>
              </div>

              <div className="rounded-3xl border p-4" style={{ background: 'rgba(111,141,255,0.12)', borderColor: 'rgba(111,141,255,0.28)' }}>
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em]" style={{ color: 'var(--accent-2)' }}>Now playing</p>
                <p className="text-lg font-medium" style={{ color: 'var(--text-h)' }}>
                  {settings.musicEnabled ? (settings.musicMode === 'piano' ? 'Piano melodies' : settings.musicMode === 'jazz' ? 'Warm jazz' : 'Relaxing nature') : 'Music paused'}
                </p>
                <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  {settings.musicEnabled ? 'A calm soundtrack will follow your writing session.' : 'Turn music on whenever you want a softer atmosphere.'}
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-3xl border px-4 py-4" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.03)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Your settings are saved automatically on this device.</p>
          <button onClick={resetSettings} className="rounded-full px-4 py-2 text-sm font-medium" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text)' }}>
            Reset to defaults
          </button>
        </div>
      </div>
    </main>
  );
}

export default SettingsPage;
