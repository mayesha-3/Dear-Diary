import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type ThemeMode = "royal-dark" | "soft-ivory";
type MusicMode = "PeacefulPiano" | "MoonlightOrchestra" | "DesertVoyage";

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

const STORAGE_KEY = "deardiary-settings-v1";

const defaultSettings: SettingsState = {
  soundEffects: true,
  theme: "royal-dark",
  brightness: 100,
  musicEnabled: true,
  musicMode: "PeacefulPiano",
  autoSave: true,
  privateMode: true,
  showHints: true,
};

function readSettings(): SettingsState {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved
      ? { ...defaultSettings, ...JSON.parse(saved) }
      : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
}

function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(readSettings);

  // Sync settings when modified from Header or another tab
  useEffect(() => {
    const syncFromStorage = () => {
      setSettings(readSettings());
    };

    window.addEventListener("diary-settings-updated", syncFromStorage);
    window.addEventListener("storage", syncFromStorage);
    return () => {
      window.removeEventListener("diary-settings-updated", syncFromStorage);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, []);

  // Apply theme & brightness visual side-effects
  useEffect(() => {
    applyTheme(settings.theme);
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty(
        "--brightness",
        `${settings.brightness}%`,
      );
      document.documentElement.style.filter = `brightness(${settings.brightness}%)`;
    }
    return () => {
      if (typeof document !== "undefined") {
        document.documentElement.style.filter = "";
      }
    };
  }, [settings.theme, settings.brightness]);

  // Helper to update state, persist to localStorage, and broadcast event
  const updateSetting = <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K],
  ) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event("diary-settings-updated"));
      return updated;
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings));
    window.dispatchEvent(new Event("diary-settings-updated"));
  };

  return (
    <main
      className="min-h-screen px-4 py-8 md:px-8"
      style={{ color: "var(--text)", background: "transparent" }}>
      <div
        className="mx-auto max-w-5xl rounded-[32px] border p-6 shadow-2xl transition-colors duration-300"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p
              className="mb-2 text-sm uppercase tracking-[0.3em]"
              style={{ color: "var(--accent-2)" }}>
              Personalize your space
            </p>
            <h1
              className="text-3xl font-semibold"
              style={{ color: "var(--text-h)" }}>
              Settings
            </h1>
            <p
              className="mt-2 max-w-2xl text-sm"
              style={{ color: "var(--text-muted)" }}>
              Tailor the app experience with comfort, ambiance, and calm
              controls that fit your journaling flow.
            </p>
          </div>
          <Link
            to="/"
            className="rounded-full border px-4 py-2 text-sm font-medium"
            style={{
              background: "var(--surface-2)",
              color: "var(--text)",
              borderColor: "var(--border)",
            }}>
            ← Back home
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section
            className="rounded-3xl border p-5"
            style={{
              background: "var(--surface-2)",
              borderColor: "var(--border)",
            }}>
            <h2
              className="mb-4 text-xl font-semibold"
              style={{ color: "var(--text-h)" }}>
              Comfort & Atmosphere
            </h2>
            <div className="space-y-4">
              <label
                className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface-3)",
                }}>
                <div>
                  <p className="font-medium">Sound effects</p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Soft clicks and feedback when you interact.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.soundEffects}
                  onChange={(e) =>
                    updateSetting("soundEffects", e.target.checked)
                  }
                  className="h-5 w-5 accent-[#5b7cff]"
                />
              </label>

              <label
                className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface-3)",
                }}>
                <div>
                  <p className="font-medium">Auto-save drafts</p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Keep your entries safe as you type.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) => updateSetting("autoSave", e.target.checked)}
                  className="h-5 w-5 accent-[#5b7cff]"
                />
              </label>

              <label
                className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface-3)",
                }}>
                <div>
                  <p className="font-medium">Private mode</p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Add a calmer, more focused experience to the app.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.privateMode}
                  onChange={(e) =>
                    updateSetting("privateMode", e.target.checked)
                  }
                  className="h-5 w-5 accent-[#5b7cff]"
                />
              </label>

              <label
                className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface-3)",
                }}>
                <div>
                  <p className="font-medium">Show hints</p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Helpful tips for new diary entries and stickers.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showHints}
                  onChange={(e) => updateSetting("showHints", e.target.checked)}
                  className="h-5 w-5 accent-[#5b7cff]"
                />
              </label>
            </div>
          </section>

          <section
            className="rounded-3xl border p-5"
            style={{
              background: "var(--surface-2)",
              borderColor: "var(--border)",
            }}>
            <h2
              className="mb-4 text-xl font-semibold"
              style={{ color: "var(--text-h)" }}>
              Appearance
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Theme</label>
                <select
                  value={settings.theme}
                  onChange={(e) =>
                    updateSetting("theme", e.target.value as ThemeMode)
                  }
                  className="w-full rounded-2xl border px-3 py-2"
                  style={{
                    background: "var(--surface-3)",
                    color: "var(--text)",
                    borderColor: "var(--border)",
                  }}>
                  <option value="royal-dark">Royal Blue Dark</option>
                  <option value="soft-ivory">Soft Ivory</option>
                </select>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium">Brightness</label>
                  <span
                    className="text-sm"
                    style={{ color: "var(--accent-2)" }}>
                    {settings.brightness}%
                  </span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="120"
                  value={settings.brightness}
                  onChange={(e) =>
                    updateSetting("brightness", Number(e.target.value))
                  }
                  className="w-full accent-[#5b7cff]"
                />
              </div>
            </div>
          </section>

          <section
            className="rounded-3xl border p-5 lg:col-span-2"
            style={{
              background: "var(--surface-2)",
              borderColor: "var(--border)",
            }}>
            <h2
              className="mb-4 text-xl font-semibold"
              style={{ color: "var(--text-h)" }}>
              Music & Calm
            </h2>
            <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                <label
                  className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface-3)",
                  }}>
                  <div>
                    <p className="font-medium">Background music</p>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-muted)" }}>
                      Gentle ambient sound while you write.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.musicEnabled}
                    onChange={(e) =>
                      updateSetting("musicEnabled", e.target.checked)
                    }
                    className="h-5 w-5 accent-[#5b7cff]"
                  />
                </label>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Choose music
                  </label>
                  <select
                    value={settings.musicMode}
                    onChange={(e) =>
                      updateSetting("musicMode", e.target.value as MusicMode)
                    }
                    className="w-full rounded-2xl border px-3 py-2"
                    style={{
                      background: "var(--surface-3)",
                      color: "var(--text)",
                      borderColor: "var(--border)",
                    }}>
                    <option value="PeacefulPiano">Peaceful Piano</option>
                    <option value="MoonlightOrchestra">
                      Moonlight Orchestra
                    </option>
                    <option value="DesertVoyage">Desert Voyage</option>
                  </select>
                </div>
              </div>

              <div
                className="rounded-3xl border p-4"
                style={{
                  background: "var(--accent-soft)",
                  borderColor: "var(--border)",
                }}>
                <p
                  className="mb-2 text-sm font-semibold uppercase tracking-[0.3em]"
                  style={{ color: "var(--accent-2)" }}>
                  Now playing
                </p>
                <p
                  className="text-lg font-medium"
                  style={{ color: "var(--text-h)" }}>
                  {settings.musicEnabled
                    ? settings.musicMode === "PeacefulPiano"
                      ? "Peaceful Piano"
                      : settings.musicMode === "MoonlightOrchestra"
                        ? "Moonlight Orchestra"
                        : "Desert Voyage"
                    : "Music paused"}
                </p>
                <p
                  className="mt-2 text-sm"
                  style={{ color: "var(--text-muted)" }}>
                  {settings.musicEnabled
                    ? "A calm soundtrack will follow your writing session."
                    : "Turn music on whenever you want a softer atmosphere."}
                </p>
              </div>
            </div>
          </section>
        </div>

        <div
          className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-3xl border px-4 py-4"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface-2)",
          }}>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Your settings are saved automatically on this device.
          </p>
          <button
            onClick={resetSettings}
            className="rounded-full border px-4 py-2 text-sm font-medium"
            style={{
              background: "var(--surface-3)",
              color: "var(--text)",
              borderColor: "var(--border)",
            }}>
            Reset to defaults
          </button>
        </div>
      </div>
    </main>
  );
}

export default SettingsPage;
