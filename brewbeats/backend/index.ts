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

/** Vibe: how the track feels — used to recommend matching alcohol in real time */
export type Vibe = {
  energy: number;
  mood: "chill" | "party" | "melancholic" | "uplifting" | "intense" | "groovy" | "romantic";
  tempo: "slow" | "medium" | "fast";
};

function mockAnalyze(url: string): { genre: string; country: string; vibe: Vibe } {
  const hash = url.split("").reduce((a, c) => (a + c.charCodeAt(0)) | 0, 0);
  const moods: Vibe["mood"][] = [
    "chill",
    "party",
    "melancholic",
    "uplifting",
    "intense",
    "groovy",
    "romantic",
  ];
  const tempos: Vibe["tempo"][] = ["slow", "medium", "fast"];
  const mood = moods[Math.abs(hash) % moods.length];
  const tempo = tempos[Math.abs(hash >> 2) % tempos.length];
  const energyMap: Record<string, number> = {
    party: 0.85,
    intense: 0.9,
    uplifting: 0.75,
    groovy: 0.65,
    chill: 0.35,
    melancholic: 0.25,
    romantic: 0.4,
  };
  return {
    genre: GENRES[Math.abs(hash) % GENRES.length],
    country: COUNTRIES[Math.abs(hash >> 4) % COUNTRIES.length],
    vibe: {
      energy: energyMap[mood] ?? 0.5,
      mood,
      tempo,
    },
  };
}

// --- Alcohol matcher: vibe → real-time recommendation (beer / wine / whisky) ---
type Drink = {
  name: string;
  img: string;
  style: string;
  buy: string;
  type: "beer" | "wine" | "whisky";
};

/** Vibe → alcohol type: sad/melancholic → whisky, romantic → wine, else beer */
const VIBE_TO_ALCOHOL_TYPE: Record<string, "beer" | "wine" | "whisky"> = {
  melancholic: "whisky",
  romantic: "wine",
  chill: "beer",
  party: "beer",
  uplifting: "beer",
  intense: "beer",
  groovy: "beer",
};

/** Mood → beer styles for when we recommend beer */
const VIBE_TO_BEER_STYLES: Record<string, string[]> = {
  party: ["IPA", "Pale Ale", "Belgian Strong", "Tripel"],
  intense: ["IPA", "Stout", "Doppelbock"],
  uplifting: ["Pale Ale", "Hefeweizen", "ESB"],
  groovy: ["Lager", "Red Ale", "Pilsner"],
  chill: ["Pilsner", "Lager", "Hefeweizen", "ESB"],
  melancholic: ["Stout", "Dubbel", "Dark Lager"],
  romantic: ["Dubbel", "Belgian Strong"],
};

const WINES: Drink[] = [
  {
    name: "Pinot Noir",
    img: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=200",
    style: "Red",
    buy: "https://www.wine.com",
    type: "wine",
  },
  {
    name: "Chardonnay",
    img: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=200",
    style: "White",
    buy: "https://www.wine.com",
    type: "wine",
  },
  {
    name: "Rosé",
    img: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=200",
    style: "Rosé",
    buy: "https://www.wine.com",
    type: "wine",
  },
];

const WHISKIES: Drink[] = [
  {
    name: "Single Malt Scotch",
    img: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=200",
    style: "Single Malt",
    buy: "https://www.thewhiskyexchange.com",
    type: "whisky",
  },
  {
    name: "Bourbon",
    img: "https://images.unsplash.com/photo-1579684947550-22e945225d9a?w=200",
    style: "Bourbon",
    buy: "https://www.thewhiskyexchange.com",
    type: "whisky",
  },
  {
    name: "Irish Whiskey",
    img: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=200",
    style: "Irish",
    buy: "https://www.thewhiskyexchange.com",
    type: "whisky",
  },
];

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

    // Beers / alcohol: recommend by vibe in real time (mood → whisky / wine / beer)
    if (url.pathname === "/beers" && req.method === "GET") {
      const country = (url.searchParams.get("country") ?? "DE").toUpperCase();
      const mood = (url.searchParams.get("mood") ?? "").toLowerCase();
      const alcoholType = mood && VIBE_TO_ALCOHOL_TYPE[mood] ? VIBE_TO_ALCOHOL_TYPE[mood] : "beer";

      let drinks: Drink[];
      if (alcoholType === "whisky") {
        drinks = [...WHISKIES];
      } else if (alcoholType === "wine") {
        drinks = [...WINES];
      } else {
        let beers = BEERS_BY_COUNTRY[country] ?? DEFAULT_BEERS;
        if (mood && VIBE_TO_BEER_STYLES[mood]) {
          const preferred = new Set(VIBE_TO_BEER_STYLES[mood].map((s) => s.toLowerCase()));
          const matching = beers.filter((b) => preferred.has(b.style.toLowerCase()));
          beers =
            matching.length > 0
              ? matching
              : [...beers].sort((a, b) => {
                  const aM = preferred.has(a.style.toLowerCase());
                  const bM = preferred.has(b.style.toLowerCase());
                  return (bM ? 1 : 0) - (aM ? 1 : 0);
                });
        }
        drinks = beers.map((b) => ({ ...b, type: "beer" as const }));
      }
      return Response.json(drinks, { headers: CORS });
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
