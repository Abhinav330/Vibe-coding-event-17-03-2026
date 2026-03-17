import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import { useLiveVibe } from "./useLiveVibe";

const API = {
  analyze: (url: string) =>
    fetch(`/api/analyze?url=${encodeURIComponent(url)}`, { method: "POST" }).then((r) => r.json()),
  beers: (country: string, level?: number, vibe?: { mood: string; energy: number }) =>
    fetch(
      `/api/beers?country=${country}${level != null ? `&level=${level}` : ""}${vibe?.mood ? `&mood=${encodeURIComponent(vibe.mood)}&energy=${vibe.energy}` : ""}`,
    ).then((r) => r.json()),
  profile: () => fetch("/api/profile").then((r) => r.json()),
  pairingTried: () => fetch("/api/pairing-tried", { method: "POST" }).then((r) => r.json()),
};

type Drink = {
  name: string;
  img: string;
  style: string;
  buy: string;
  type?: "beer" | "wine" | "whisky";
};
type Profile = {
  points: number;
  level: string;
  levelIndex: number;
  streak: number;
  badges: string[];
};

const VALID_HOSTS = ["youtube.com", "youtu.be", "spotify.com", "soundcloud.com"];
const DIRECT_AUDIO_EXT = [".mp3", ".wav", ".ogg", ".m4a", ".aac"];

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (!u.protocol.startsWith("http")) return false;
    return VALID_HOSTS.some((h) => u.hostname.includes(h)) || isDirectAudioUrl(url);
  } catch {
    return false;
  }
}

/** True if the URL is a direct audio file we can play and analyze in real time */
function isDirectAudioUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return DIRECT_AUDIO_EXT.some((ext) => path.endsWith(ext));
  } catch {
    return false;
  }
}

export default function App() {
  const [url, setUrl] = useState("");
  const [trackInfo, setTrackInfo] = useState<{
    genre: string;
    country: string;
    vibe?: { energy: number; mood: string; tempo: string };
  } | null>(null);
  const [beers, setBeers] = useState<Drink[]>([]);
  const [leaderboard, setLeaderboard] = useState<
    { userId: string; points: number; level: string }[]
  >([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [beersLoading, setBeersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pairingTried, setPairingTried] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const onLiveVibeChange = useCallback(
    (vibe: { energy: number; mood: string }) => {
      if (!trackInfo?.country) return;
      const level = profile?.levelIndex ?? 0;
      API.beers(trackInfo.country, level + 1, {
        mood: vibe.mood,
        energy: vibe.energy,
      })
        .then((list) => setBeers(Array.isArray(list) ? list : []))
        .catch(() => {});
    },
    [trackInfo?.country, profile?.levelIndex],
  );

  const liveVibe = useLiveVibe(audioRef, onLiveVibeChange, { debounceMs: 4000 });

  const loadProfile = useCallback(() => {
    API.profile()
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const loadLeaderboard = useCallback(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then(setLeaderboard)
      .catch(() => setLeaderboard([]));
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").trim();
    if (text) setUrl(text);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setTrackInfo(null);
      setBeers([]);
      setPairingTried(false);
      if (!url.trim()) return;
      if (!isValidUrl(url)) {
        setError("Unsupported URL. Use YouTube, Spotify, or SoundCloud.");
        return;
      }
      setLoading(true);
      setBeersLoading(true);
      try {
        const analysis = await API.analyze(url);
        setTrackInfo(analysis);
        setBeersLoading(true);
        const level = profile?.levelIndex ?? 0;
        // Recommend alcohol based on vibe first (read vibe → then recommend)
        const list = await API.beers(analysis.country, level + 1, analysis.vibe);
        setBeers(Array.isArray(list) ? list : []);
        setPairingTried(false);
      } catch (err) {
        setError("Analysis failed. Try again.");
      } finally {
        setLoading(false);
        setBeersLoading(false);
      }
    },
    [url, profile?.levelIndex],
  );

  const handlePairingTried = useCallback(() => {
    if (pairingTried) return;
    setPairingTried(true);
    API.pairingTried()
      .then((data) => {
        setProfile((p) => (p ? { ...p, points: data.points, level: data.level } : null));
        loadProfile();
        loadLeaderboard();
      })
      .catch(() => setPairingTried(false));
  }, [pairingTried, loadProfile, loadLeaderboard]);

  return (
    <div className="app">
      <header className="header">
        <img src="/logo.png" alt="Hops and Harmonies" className="logo" />
        <h1>Hops and Harmonies</h1>
        <p className="tagline">Paste a track → get beer pairings</p>
        {profile != null && (
          <div className="badges">
            <span className="badge">Level: {profile.level}</span>
            <span className="badge">{profile.points} pts</span>
            {profile.streak > 0 && <span className="badge">Streak: {profile.streak}</span>}
          </div>
        )}
      </header>

      <form onSubmit={handleSubmit} className="url-form">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onPaste={handlePaste}
          placeholder="Paste YouTube, Spotify or SoundCloud URL..."
          className="url-input"
        />
        <button type="submit" className="play-btn" disabled={loading}>
          {loading ? "..." : "Go"}
        </button>
      </form>

      {error && (
        <div className="toast" role="alert">
          {error}
        </div>
      )}

      {trackInfo && (
        <section className="track-section">
          <div className="track-info">
            {trackInfo.vibe && (
              <p className="vibe-first">
                We read the vibe: <strong>{trackInfo.vibe.mood}</strong> · {trackInfo.vibe.tempo} ·
                energy {Math.round(trackInfo.vibe.energy * 100)}%
              </p>
            )}
            {liveVibe && (
              <p className="live-vibe">
                Live vibe: <strong>{liveVibe.mood}</strong> · {Math.round(liveVibe.energy * 100)}% —
                recommendations update as you listen
              </p>
            )}
            <span>Genre: {trackInfo.genre}</span>
            <span>Region: {trackInfo.country}</span>
          </div>
          <div className="player-wrap">
            {/* biome-ignore lint/a11y/useMediaCaption: Stub player; no real audio source for captions */}
            <audio
              ref={audioRef}
              controls
              className="audio-player"
              src={isDirectAudioUrl(url) ? url : undefined}
            />
            <p className="player-hint">
              {isDirectAudioUrl(url)
                ? "Direct audio: play to see live vibe and real-time recommendations."
                : "Paste a track URL (or a direct .mp3/.wav link) for vibe-based pairings."}
            </p>
          </div>
        </section>
      )}

      {beersLoading && !beers.length && (
        <div className="spinner-wrap">
          <div className="spinner" aria-hidden />
        </div>
      )}

      {beers.length > 0 && (
        <section className="beers-section">
          <h2>
            {trackInfo?.vibe || liveVibe
              ? `We recommend ${beers[0]?.type ?? "beer"} for this ${liveVibe?.mood ?? trackInfo?.vibe?.mood ?? "vibe"} vibe`
              : "Based on this vibe we recommend"}
          </h2>
          <div className="beer-grid">
            {beers.map((drink) => (
              <DrinkCard key={drink.name} drink={drink} onTry={handlePairingTried} />
            ))}
          </div>
        </section>
      )}

      <section className="leaderboard-section">
        <h2>Leaderboard (Top 10)</h2>
        {leaderboard.length > 0 ? (
          <ol className="leaderboard-list">
            {leaderboard.map((entry, i) => (
              <li key={entry.userId}>
                <span className="rank">{i + 1}.</span> {entry.userId}: {entry.points} pts ·{" "}
                {entry.level}
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted">No scores yet. Try a pairing to earn points!</p>
        )}
      </section>

      {beers.length > 0 && !pairingTried && (
        <p className="try-hint">Try a pairing to earn +10 points!</p>
      )}
    </div>
  );
}

function DrinkCard({
  drink,
  onTry,
}: {
  drink: Drink;
  onTry: () => void;
}) {
  return (
    <article className="beer-card">
      {drink.type && <span className="drink-type-tag">{drink.type}</span>}
      <img src={drink.img} alt="" className="beer-img" />
      <h3 className="beer-name">{drink.name}</h3>
      <p className="beer-style">{drink.style}</p>
      <a
        href={drink.buy}
        target="_blank"
        rel="noopener noreferrer"
        className="buy-btn"
        onClick={onTry}
      >
        Where to buy
      </a>
    </article>
  );
}
