"use client";

import { useCallback, useEffect, useState, type ClipboardEvent, type FormEvent } from "react";

type Pricing = { company: string; price: string; url: string };
type Drink = {
  name: string;
  img: string;
  style: string;
  buy: string;
  type?: "beer" | "wine" | "whisky" | "cider";
  pricings?: Pricing[];
};
type ConnectionEntry = {
  id: string;
  trackOrPlaylist: string;
  drinkName: string;
  timestamp: string;
};
type Profile = {
  points: number;
  level: string;
  levelIndex: number;
  streak: number;
  badges: string[];
};
type Vibe = { energy: number; mood: string; tempo: string };
type AnalyzeResponse = {
  genre: string;
  country: string;
  vibe?: Vibe;
  isPlaylist?: boolean;
};
type LeaderboardEntry = {
  userId: string;
  points: number;
  level: string;
};
type PairingTriedResponse = {
  points: number;
  level: string;
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");

function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  return fetch(apiUrl(path), init).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return (await response.json()) as T;
  });
}

const API = {
  analyze: (url: string) => {
    const params = new URLSearchParams({ url });
    return fetchJson<AnalyzeResponse>(`/api/analyze?${params.toString()}`, { method: "POST" });
  },
  beers: (country: string, level?: number, vibe?: { mood: string; energy: number }, seed?: string) => {
    const params = new URLSearchParams({ country });
    if (level != null) params.set("level", String(level));
    if (vibe?.mood) {
      params.set("mood", vibe.mood);
      params.set("energy", String(vibe.energy));
    }
    if (seed) params.set("seed", seed);
    return fetchJson<Drink[]>(`/api/beers?${params.toString()}`);
  },
  profile: () => fetchJson<Profile>("/api/profile"),
  pairingTried: (body: { trackOrPlaylist?: string; drinkName?: string }) =>
    fetchJson<PairingTriedResponse>("/api/pairing-tried", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  history: () => fetchJson<ConnectionEntry[]>("/api/history"),
  leaderboard: () => fetchJson<LeaderboardEntry[]>("/api/leaderboard"),
};

const VALID_HOSTS = ["youtube.com", "youtu.be", "spotify.com", "soundcloud.com"];
const DIRECT_AUDIO_EXT = [".mp3", ".wav", ".ogg", ".m4a", ".aac"];

function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    if (!parsedUrl.protocol.startsWith("http")) return false;
    return VALID_HOSTS.some((host) => parsedUrl.hostname.includes(host)) || isDirectAudioUrl(url);
  } catch {
    return false;
  }
}

function isDirectAudioUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return DIRECT_AUDIO_EXT.some((extension) => path.endsWith(extension));
  } catch {
    return false;
  }
}

function isYouTubeUrl(inputUrl: string): boolean {
  try {
    const host = new URL(inputUrl.trim()).hostname.toLowerCase();
    return host.includes("youtube.com") || host.includes("youtu.be");
  } catch {
    return false;
  }
}

function isYouTubePlaylistUrl(inputUrl: string): boolean {
  try {
    const parsedUrl = new URL(inputUrl.trim());
    const host = parsedUrl.hostname.toLowerCase();
    if (!host.includes("youtube.com") && !host.includes("youtu.be")) return false;
    return (
      parsedUrl.pathname.toLowerCase().includes("playlist") || parsedUrl.searchParams.has("list")
    );
  } catch {
    return false;
  }
}

function getEmbedUrl(inputUrl: string): string | null {
  try {
    const trimmedUrl = inputUrl.trim();
    const parsedUrl = new URL(trimmedUrl);
    const host = parsedUrl.hostname.toLowerCase();
    const pathname = parsedUrl.pathname.toLowerCase();
    const embedBase = "https://www.youtube-nocookie.com/embed";

    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      const listId = parsedUrl.searchParams.get("list");
      const isPlaylistPage = pathname.includes("playlist");
      if (isPlaylistPage || listId) {
        const id = listId?.trim();
        if (id) {
          return `${embedBase}/videoseries?list=${encodeURIComponent(id)}`;
        }
        if (isPlaylistPage) return null;
      }
      const videoId = host.includes("youtu.be")
        ? pathname.slice(1).split("/")[0].split("?")[0]
        : parsedUrl.searchParams.get("v");
      if (videoId?.trim()) return `${embedBase}/${encodeURIComponent(videoId.trim())}`;
      return null;
    }

    if (host.includes("spotify.com")) {
      const path = parsedUrl.pathname.replace(/^\//, "").replace(/\/$/, "");
      if (path.startsWith("track/") || path.startsWith("playlist/") || path.startsWith("album/")) {
        return `https://open.spotify.com/embed/${path}`;
      }
      return null;
    }

    if (host.includes("soundcloud.com")) {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(inputUrl)}`;
    }

    return null;
  } catch {
    return null;
  }
}

function getOpenInLabel(inputUrl: string): string {
  try {
    const host = new URL(inputUrl.trim()).hostname.toLowerCase();
    if (host.includes("youtube") || host.includes("youtu.be")) return "Open in YouTube";
    if (host.includes("spotify")) return "Open in Spotify";
    if (host.includes("soundcloud")) return "Open in SoundCloud";
  } catch {
    // Ignore invalid URLs.
  }
  return "Open in new tab";
}

function getPourLabel(type: "beer" | "wine" | "whisky" | "cider" | undefined): string {
  switch (type) {
    case "wine":
      return "Wine";
    case "whisky":
      return "Whisky";
    case "cider":
      return "Cider";
    case "beer":
      return "Beer";
    default:
      return "Drinks";
  }
}

function getPairingTagline(type: "beer" | "wine" | "whisky" | "cider" | undefined): string {
  switch (type) {
    case "wine":
      return "This vibe calls for wine.";
    case "whisky":
      return "Whisky for the moment.";
    case "cider":
      return "Crisp cider, good vibes.";
    case "beer":
      return "Beer and tunes.";
    default:
      return "Your perfect pour.";
  }
}

export default function Page() {
  const [url, setUrl] = useState("");
  const [trackInfo, setTrackInfo] = useState<AnalyzeResponse | null>(null);
  const [history, setHistory] = useState<ConnectionEntry[]>([]);
  const [beers, setBeers] = useState<Drink[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [beersLoading, setBeersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pairingTried, setPairingTried] = useState(false);

  const loadProfile = useCallback(() => {
    API.profile()
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const loadLeaderboard = useCallback(() => {
    API.leaderboard()
      .then((entries) => setLeaderboard(Array.isArray(entries) ? entries : []))
      .catch(() => setLeaderboard([]));
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const loadHistory = useCallback(() => {
    API.history()
      .then((entries) => setHistory(Array.isArray(entries) ? entries : []))
      .catch(() => setHistory([]));
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handlePaste = useCallback((event: ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData("text").trim();
    if (text) setUrl(text);
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setError(null);
      setTrackInfo(null);
      setBeers([]);
      setPairingTried(false);
      if (!url.trim()) return;
      if (!isValidUrl(url)) {
        setError("Unsupported URL. Use a track or playlist from YouTube, Spotify, or SoundCloud.");
        return;
      }

      setLoading(true);
      setBeersLoading(true);
      try {
        const analysis = await API.analyze(url);
        setTrackInfo(analysis);

        const level = profile?.levelIndex ?? 0;
        const list = await API.beers(analysis.country, level + 1, analysis.vibe, url.trim());
        setBeers(Array.isArray(list) ? list : []);
        setPairingTried(false);
      } catch {
        setError("Analysis failed. Try again.");
      } finally {
        setLoading(false);
        setBeersLoading(false);
      }
    },
    [url, profile?.levelIndex],
  );

  const handlePairingTried = useCallback(
    (drinkName: string) => {
      if (pairingTried) return;
      setPairingTried(true);

      const trackOrPlaylist = trackInfo?.isPlaylist ? "Playlist" : "Track";
      API.pairingTried({ trackOrPlaylist, drinkName })
        .then((data) => {
          setProfile((current) =>
            current ? { ...current, points: data.points, level: data.level } : null,
          );
          loadProfile();
          loadLeaderboard();
          loadHistory();
        })
        .catch(() => setPairingTried(false));
    },
    [pairingTried, trackInfo?.isPlaylist, loadProfile, loadLeaderboard, loadHistory],
  );

  const xpInLevel = profile ? profile.points % 100 : 0;
  const xpPercent = Math.min(100, xpInLevel);

  return (
    <div className="app">
      {profile != null && (
        <div className="xp-bar-wrap">
          <div className="xp-bar-track">
            <div className="xp-bar-fill" style={{ width: `${xpPercent}%` }}>
              <span className="xp-bar-label">{xpPercent}%</span>
            </div>
          </div>
          <span className="xp-bar-text">XP: {xpInLevel}/100</span>
        </div>
      )}

      <header className="header">
        <h1 className="title-main">HOPS AND HARMONIES</h1>
        <p className="title-sub">Hops and Harmonies</p>
        {profile != null && (
          <div className="badges">
            <span className="badge">Level: {profile.level}</span>
            <span className="badge">{profile.points} pts</span>
            <span className="badge">Streak: {profile.streak}</span>
          </div>
        )}
      </header>

      <form onSubmit={handleSubmit} className="url-form">
        <input
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          onPaste={handlePaste}
          placeholder="Paste a track or playlist URL (YouTube, Spotify, SoundCloud)..."
          className="url-input"
        />
        <button type="submit" className="play-btn" disabled={loading}>
          {loading ? "..." : "Go"}
        </button>
      </form>

      {trackInfo && url.trim() && (
        <p className="genre-region">
          Genre: {trackInfo.genre} | Region: {trackInfo.country}
        </p>
      )}

      {error && (
        <div className="toast" role="alert">
          {error}
        </div>
      )}

      {beersLoading && !beers.length && (
        <div className="spinner-wrap">
          <div className="spinner" aria-hidden />
        </div>
      )}

      {trackInfo && beers.length > 0 && (
        <section className="pairing-hero">
          <div className="now-pairing-disc">
            <div className="disc-inner">
              <span className="disc-icon" aria-hidden>
                ♪
              </span>
              <span className="disc-title">YOUR POUR</span>
              <span className="disc-tagline">{getPairingTagline(beers[0]?.type)}</span>
              <span className="disc-meta">
                {getPourLabel(beers[0]?.type).toUpperCase()} · {trackInfo.genre} · {" "}
                {trackInfo.country}
              </span>
            </div>
          </div>
          <div className="beer-panels">
            <div className="beer-panels-left">
              {beers.slice(0, 2).map((drink) => (
                <DrinkCard key={drink.name} drink={drink} onTry={() => handlePairingTried(drink.name)} />
              ))}
            </div>
            <div className="beer-panels-right">
              {beers[2] && (
                <DrinkCard drink={beers[2]} onTry={() => handlePairingTried(beers[2].name)} />
              )}
            </div>
          </div>
        </section>
      )}

      {beers.length > 0 && !trackInfo && (
        <section className="beers-section">
          <h2 className="pairing-section-heading">Your picks · {getPourLabel(beers[0]?.type)}</h2>
          <div className="beer-grid">
            {beers.map((drink) => (
              <DrinkCard key={drink.name} drink={drink} onTry={() => handlePairingTried(drink.name)} />
            ))}
          </div>
        </section>
      )}

      {trackInfo &&
        url.trim() &&
        (() => {
          const embedUrl = getEmbedUrl(url);
          const isPlaylist = isYouTubePlaylistUrl(url);

          return (
            <section className="track-section track-section-compact">
              <div className="play-options">
                <a
                  href={url.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="open-external-btn"
                >
                  {getOpenInLabel(url)}
                </a>
                {embedUrl && (
                  <>
                    <div className={`embed-wrap ${isPlaylist ? "embed-wrap--playlist" : ""}`}>
                      <iframe
                        title={isPlaylist ? "Play YouTube playlist" : "Play track or playlist"}
                        src={embedUrl}
                        className="embed-player"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    {isYouTubeUrl(url) && (
                      <p className="embed-hint">
                        If you see a playback error, use <strong>Open in YouTube</strong> above.
                      </p>
                    )}
                  </>
                )}
              </div>
            </section>
          );
        })()}

      <div className="steps-cta">
        <div className="step-circles">
          <span className={`step-circle ${url.trim() ? "done" : ""}`} aria-hidden>
            ✓
          </span>
          <span className={`step-circle ${beers.length > 0 ? "done" : ""}`} aria-hidden>
            ✓
          </span>
          <span className={`step-circle ${pairingTried ? "done" : ""}`} aria-hidden>
            {pairingTried ? "✓" : ""}
          </span>
        </div>
        {beers.length > 0 && !pairingTried && <p className="try-hint">Try a pairing to earn +10 points!</p>}
      </div>

      <section className="history-section">
        <h2>Connection history</h2>
        {history.length > 0 ? (
          <ul className="history-list">
            {history.map((entry) => (
              <li key={entry.id} className="history-item">
                <span className="history-label">{entry.trackOrPlaylist}</span>
                <span className="history-arrow">→</span>
                <span className="history-drink">{entry.drinkName}</span>
                <span className="history-date">
                  {new Date(entry.timestamp).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No pairings yet. Try a track or playlist and click a buy link!</p>
        )}
      </section>

      <section className="leaderboard-section">
        <h2>Leaderboard (Top 10)</h2>
        {leaderboard.length > 0 ? (
          <ol className="leaderboard-list">
            {leaderboard.map((entry, index) => (
              <li key={entry.userId}>
                <span className="rank">{index + 1}.</span> {entry.userId}: {entry.points} pts · {" "}
                {entry.level}
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted">No scores yet. Try a pairing to earn points!</p>
        )}
      </section>

      <span className="corner-star" aria-hidden>
        ★
      </span>
    </div>
  );
}

function DrinkCard({ drink, onTry }: { drink: Drink; onTry: () => void }) {
  const [imgError, setImgError] = useState(false);
  const buyUrl = drink.pricings?.[0]?.url ?? drink.buy ?? "https://www.amazon.com/s?k=drinks";
  const showImg = drink.img && !imgError;

  const fallbackIcon =
    drink.type === "wine"
      ? "🍷"
      : drink.type === "whisky"
        ? "🥃"
        : drink.type === "cider"
          ? "🍎"
          : drink.style?.toLowerCase().includes("stout")
            ? "🍺"
            : drink.style?.toLowerCase().includes("lager")
              ? "🍻"
              : "🍺";

  return (
    <article className="beer-card beer-card-panel">
      <div className="beer-card-thumb">
        {showImg ? (
          <img src={drink.img} alt="" className="beer-card-img" onError={() => setImgError(true)} />
        ) : (
          <span className="beer-card-icon" aria-hidden>
            {fallbackIcon}
          </span>
        )}
      </div>
      <div className="beer-card-body">
        <h3 className="beer-name">{drink.name}</h3>
        <p className="beer-style">{drink.style}</p>
        <a
          href={buyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="where-to-buy-btn"
          onClick={onTry}
        >
          Where to buy
        </a>
      </div>
    </article>
  );
}
