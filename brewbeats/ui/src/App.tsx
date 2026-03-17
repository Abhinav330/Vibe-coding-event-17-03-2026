import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";

const API = {
  analyze: (url: string) =>
    fetch(`/api/analyzer/analyze?url=${encodeURIComponent(url)}`, { method: "POST" }).then((r) =>
      r.json(),
    ),
  beers: (country: string, level?: number) =>
    fetch(`/api/beers/beers?country=${country}${level != null ? `&level=${level}` : ""}`).then(
      (r) => r.json(),
    ),
  profile: () => fetch("/api/gamify/profile").then((r) => r.json()),
  pairingTried: () => fetch("/api/gamify/pairing-tried", { method: "POST" }).then((r) => r.json()),
};

type Beer = { name: string; img: string; style: string; buy: string };
type Profile = {
  points: number;
  level: string;
  levelIndex: number;
  streak: number;
  badges: string[];
};

const VALID_HOSTS = ["youtube.com", "youtu.be", "spotify.com", "soundcloud.com"];

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return VALID_HOSTS.some((h) => u.hostname.includes(h));
  } catch {
    return false;
  }
}

export default function App() {
  const [url, setUrl] = useState("");
  const [trackInfo, setTrackInfo] = useState<{ genre: string; country: string } | null>(null);
  const [beers, setBeers] = useState<Beer[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [beersLoading, setBeersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pairingTried, setPairingTried] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadProfile = useCallback(() => {
    API.profile()
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

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
        const list = await API.beers(analysis.country, level + 1);
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
      })
      .catch(() => setPairingTried(false));
  }, [pairingTried, loadProfile]);

  return (
    <div className="app">
      <header className="header">
        <h1>BrewBeats</h1>
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
            <span>Genre: {trackInfo.genre}</span>
            <span>Region: {trackInfo.country}</span>
          </div>
          <div className="player-wrap">
            {/* biome-ignore lint/a11y/useMediaCaption: Stub player; no real audio source for captions */}
            <audio
              ref={audioRef}
              controls
              className="audio-player"
              src={url.startsWith("http") ? undefined : undefined}
            />
            <p className="player-hint">Paste a real track URL to play. Stub analysis only.</p>
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
          <h2>Beer pairings</h2>
          <div className="beer-grid">
            {beers.map((beer) => (
              <BeerCard key={beer.name} beer={beer} onTry={handlePairingTried} />
            ))}
          </div>
        </section>
      )}

      {beers.length > 0 && !pairingTried && (
        <p className="try-hint">Try a pairing to earn +10 points!</p>
      )}
    </div>
  );
}

function BeerCard({
  beer,
  onTry,
}: {
  beer: Beer;
  onTry: () => void;
}) {
  return (
    <article className="beer-card">
      <img src={beer.img} alt="" className="beer-img" />
      <h3 className="beer-name">{beer.name}</h3>
      <p className="beer-style">{beer.style}</p>
      <a
        href={beer.buy}
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
