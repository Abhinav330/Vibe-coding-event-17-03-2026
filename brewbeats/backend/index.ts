/**
 * BrewBeats – single API server (analyzer + beer-matcher + gamify)
 * Port: 4000
 */

const PORT = 4000;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// --- Analyzer (stub) ---
const COUNTRIES = ["DE", "US", "GB", "BE", "CZ", "IE"] as const;
const GENRES = ["Rock", "Electronic", "Folk", "Jazz", "Hip-Hop", "Indie"] as const;

function mockAnalyze(url: string): { genre: string; country: string } {
  const hash = url.split("").reduce((a, c) => (a + c.charCodeAt(0)) | 0, 0);
  return {
    genre: GENRES[Math.abs(hash) % GENRES.length],
    country: COUNTRIES[Math.abs(hash >> 4) % COUNTRIES.length],
  };
}

// --- Beer matcher (stub) ---
type Beer = { name: string; img: string; style: string; buy: string };

const BEERS_BY_COUNTRY: Record<string, Beer[]> = {
  DE: [
    {
      name: "Weihenstephaner Hefeweissbier",
      img: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=200",
      style: "Hefeweizen",
      buy: "https://www.beerwulf.com/en-gb/c/weissbier",
    },
    {
      name: "Paulaner Salvator",
      img: "https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=200",
      style: "Doppelbock",
      buy: "https://www.beerwulf.com/en-gb/c/bock",
    },
    {
      name: "Radeberger Pilsner",
      img: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=200",
      style: "Pilsner",
      buy: "https://www.beerwulf.com/en-gb/c/pilsner",
    },
  ],
  US: [
    {
      name: "Sierra Nevada Pale Ale",
      img: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=200",
      style: "Pale Ale",
      buy: "https://www.craftbeer.com/beer-styles/american-pale-ale",
    },
    {
      name: "Brooklyn Lager",
      img: "https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=200",
      style: "Lager",
      buy: "https://www.brooklynbrewery.com",
    },
    {
      name: "Goose Island IPA",
      img: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=200",
      style: "IPA",
      buy: "https://www.gooseisland.com",
    },
  ],
  GB: [
    {
      name: "Fuller's London Pride",
      img: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=200",
      style: "ESB",
      buy: "https://www.fullers.co.uk",
    },
    {
      name: "Guinness Draught",
      img: "https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=200",
      style: "Stout",
      buy: "https://www.guinness.com",
    },
    {
      name: "BrewDog Punk IPA",
      img: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=200",
      style: "IPA",
      buy: "https://www.brewdog.com",
    },
  ],
  BE: [
    {
      name: "Westmalle Tripel",
      img: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=200",
      style: "Tripel",
      buy: "https://www.trappistwestmalle.be",
    },
    {
      name: "Chimay Bleue",
      img: "https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=200",
      style: "Dubbel",
      buy: "https://www.chimay.com",
    },
    {
      name: "Duvel",
      img: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=200",
      style: "Belgian Strong",
      buy: "https://www.duvel.com",
    },
  ],
  CZ: [
    {
      name: "Pilsner Urquell",
      img: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=200",
      style: "Pilsner",
      buy: "https://www.pilsnerurquell.com",
    },
    {
      name: "Budweiser Budvar",
      img: "https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=200",
      style: "Lager",
      buy: "https://www.budweiserbudvar.cz",
    },
    {
      name: "Kozel Dark",
      img: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=200",
      style: "Dark Lager",
      buy: "https://www.kozel.cz",
    },
  ],
  IE: [
    {
      name: "Guinness Extra Stout",
      img: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=200",
      style: "Stout",
      buy: "https://www.guinness.com",
    },
    {
      name: "Smithwick's Red Ale",
      img: "https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=200",
      style: "Red Ale",
      buy: "https://www.smithwicks.com",
    },
    {
      name: "Harp Lager",
      img: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=200",
      style: "Lager",
      buy: "https://www.harp.ie",
    },
  ],
};
const DEFAULT_BEERS = BEERS_BY_COUNTRY.DE;

// --- Gamification ---
const LEVELS = [
  { name: "Novice", min: 0 },
  { name: "Explorer", min: 100 },
  { name: "Master Brewer", min: 500 },
] as const;
const POINTS_PAIRING = 10;
const POINTS_FAVORITE = 20;
const POINTS_SHARE = 50;

type Profile = {
  userId: string;
  points: number;
  level: string;
  levelIndex: number;
  streak: number;
  lastSessionDate: string | null;
  badges: string[];
};

const store = new Map<string, Profile>();

function ensureProfile(userId: string): Profile {
  let p = store.get(userId);
  if (!p) {
    p = {
      userId,
      points: 0,
      level: LEVELS[0].name,
      levelIndex: 0,
      streak: 0,
      lastSessionDate: null,
      badges: [],
    };
    store.set(userId, p);
  }
  return p;
}

function updateLevel(profile: Profile): void {
  let idx = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (profile.points >= LEVELS[i].min) {
      idx = i;
      break;
    }
  }
  profile.levelIndex = idx;
  profile.level = LEVELS[idx].name;
}

function updateStreak(profile: Profile): void {
  const today = new Date().toISOString().slice(0, 10);
  if (profile.lastSessionDate === today) return;
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  profile.streak = profile.lastSessionDate === yesterday ? profile.streak + 1 : 1;
  profile.lastSessionDate = today;
}

// --- Single server ---
const server = Bun.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    const userId = url.searchParams.get("userId") ?? req.headers.get("x-user-id") ?? "default";

    // Analyzer
    if (url.pathname === "/analyze" && req.method === "POST") {
      const urlParam = url.searchParams.get("url") ?? "";
      if (!urlParam)
        return Response.json({ error: "Missing url query parameter" }, { status: 400 });
      return Response.json(mockAnalyze(urlParam), { headers: CORS });
    }

    // Beers
    if (url.pathname === "/beers" && req.method === "GET") {
      const country = (url.searchParams.get("country") ?? "DE").toUpperCase();
      const beers = BEERS_BY_COUNTRY[country] ?? DEFAULT_BEERS;
      return Response.json(beers, { headers: CORS });
    }

    // Gamification
    if (url.pathname === "/profile" && req.method === "GET") {
      const profile = ensureProfile(userId);
      updateLevel(profile);
      return Response.json(profile, { headers: CORS });
    }
    if (url.pathname === "/pairing-tried" && req.method === "POST") {
      const profile = ensureProfile(userId);
      profile.points += POINTS_PAIRING;
      updateStreak(profile);
      updateLevel(profile);
      return Response.json({ points: profile.points, level: profile.level }, { headers: CORS });
    }
    if (url.pathname === "/favorite" && req.method === "POST") {
      const profile = ensureProfile(userId);
      profile.points += POINTS_FAVORITE;
      updateStreak(profile);
      updateLevel(profile);
      return Response.json({ points: profile.points }, { headers: CORS });
    }
    if (url.pathname === "/share" && req.method === "POST") {
      const profile = ensureProfile(userId);
      profile.points += POINTS_SHARE;
      updateStreak(profile);
      updateLevel(profile);
      return Response.json({ points: profile.points }, { headers: CORS });
    }
    if (url.pathname === "/leaderboard" && req.method === "GET") {
      const top = Array.from(store.values())
        .sort((a, b) => b.points - a.points)
        .slice(0, 10)
        .map((p) => ({ userId: p.userId, points: p.points, level: p.level }));
      return Response.json(top, { headers: CORS });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`BrewBeats API http://localhost:${server.port}`);
