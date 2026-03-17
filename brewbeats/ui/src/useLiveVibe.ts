/**
 * Real-time vibe from the currently playing audio (Web Audio API).
 * Use when <audio> has a playable src (e.g. direct MP3/stream). YouTube/Spotify
 * iframes often don't expose raw audio, so live vibe works best with direct audio URLs.
 */
import { useCallback, useEffect, useRef, useState } from "react";

export type LiveVibe = { energy: number; mood: string };

const ENERGY_TO_MOOD: Array<{ min: number; mood: string }> = [
  { min: 0, mood: "chill" },
  { min: 0.25, mood: "melancholic" },
  { min: 0.4, mood: "groovy" },
  { min: 0.55, mood: "uplifting" },
  { min: 0.7, mood: "party" },
  { min: 0.85, mood: "intense" },
];

function energyToMood(energy: number): string {
  for (let i = ENERGY_TO_MOOD.length - 1; i >= 0; i--) {
    if (energy >= ENERGY_TO_MOOD[i].min) return ENERGY_TO_MOOD[i].mood;
  }
  return "chill";
}

export function useLiveVibe(
  audioRef: React.RefObject<HTMLAudioElement | null>,
  onVibeChange?: (vibe: LiveVibe) => void,
  options?: { intervalMs?: number; debounceMs?: number },
) {
  const [liveVibe, setLiveVibe] = useState<LiveVibe | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number>(0);
  const lastEmitRef = useRef<number>(0);
  const onVibeChangeRef = useRef(onVibeChange);
  onVibeChangeRef.current = onVibeChange;
  const debounceMs = options?.debounceMs ?? 3000;

  const stop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (sourceRef.current && ctxRef.current?.state !== "closed") {
      try {
        sourceRef.current.disconnect();
      } catch {
        /* already disconnected */
      }
      sourceRef.current = null;
    }
    if (analyserRef.current) analyserRef.current = null;
    if (ctxRef.current?.state !== "closed") {
      ctxRef.current?.close();
    }
    ctxRef.current = null;
    setLiveVibe(null);
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onPlay = () => {
      if (!el.src) return;
      const ctx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      const source = ctx.createMediaElementSource(el);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      ctxRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;

      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (!analyserRef.current || !ctxRef.current || ctxRef.current.state === "closed") return;
        analyserRef.current.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const energy = Math.min(1, sum / (data.length * 255));
        const mood = energyToMood(energy);
        setLiveVibe({ energy, mood });

        const now = Date.now();
        if (onVibeChangeRef.current && now - lastEmitRef.current >= debounceMs) {
          lastEmitRef.current = now;
          onVibeChangeRef.current({ energy, mood });
        }

        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    const onPause = () => stop();
    const onEnded = () => stop();

    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      stop();
    };
  }, [audioRef, stop, debounceMs]);

  return liveVibe;
}
