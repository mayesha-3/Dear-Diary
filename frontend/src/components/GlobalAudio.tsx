import { useEffect, useRef } from "react";

import pianoTrack from "../assets/Music/Peaceful Piano.mp3";
import jazzTrack from "../assets/Music/Moonlight Orchestra.mp3";
import natureTrack from "../assets/Music/Desert Voyage.mp3";

type MusicMode = "piano" | "jazz" | "nature";

const musicTracks: Record<MusicMode, string> = {
  piano: pianoTrack,
  jazz: jazzTrack,
  nature: natureTrack,
};

const STORAGE_KEY = "deardiary-settings-v1";

export function GlobalAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const syncAndPlayAudio = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        return;
      }

      const settings = JSON.parse(saved);
      const { musicEnabled, musicMode } = settings;

      if (!musicEnabled || !musicMode) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        return;
      }

      const trackUrl = musicTracks[musicMode as MusicMode];

      // If the same track is already playing, do nothing!
      if (
        audioRef.current &&
        audioRef.current.src.endsWith(encodeURI(trackUrl))
      ) {
        return;
      }

      // Stop previous track if switching tracks
      if (audioRef.current) {
        audioRef.current.pause();
      }

      // Start new track
      const newAudio = new Audio(trackUrl);
      newAudio.loop = true;
      newAudio.volume = 0.3;

      audioRef.current = newAudio;

      const playPromise = newAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn(
            "Playback prevented by browser interaction policy:",
            err,
          );
        });
      }
    } catch (e) {
      console.error("Error syncing global audio settings:", e);
    }
  };

  useEffect(() => {
    // Sync audio on initial app render
    syncAndPlayAudio();

    // Listen to localStorage changes triggered from SettingsPage
    const handleStorageChange = () => {
      syncAndPlayAudio();
    };

    // Custom event to handle immediate updates on the same tab
    window.addEventListener("diary-settings-updated", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("diary-settings-updated", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return null;
}
