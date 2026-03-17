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

function isPlaylistUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes("/playlist") || lower.includes("list=") || lower.includes("/sets/");
}

function mockAnalyze(url: string): {
  genre: string;
  country: string;
  vibe: Vibe;
  isPlaylist: boolean;
} {
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
    isPlaylist: isPlaylistUrl(url),
  };
}

// --- Alcohol matcher: vibe → real-time recommendation (beer / wine / whisky / cider) ---
type Pricing = { company: string; price: string; url: string };
type DrinkType = "beer" | "wine" | "whisky" | "cider";
type Drink = {
  name: string;
  img: string;
  style: string;
  buy: string;
  type: DrinkType;
  pricings?: Pricing[];
};

/** Vibe → alcohol type: melancholic → whisky, romantic → wine, uplifting/chill → cider, else beer */
const VIBE_TO_ALCOHOL_TYPE: Record<string, DrinkType> = {
  melancholic: "whisky",
  romantic: "wine",
  uplifting: "cider",
  chill: "cider",
  party: "beer",
  intense: "beer",
  groovy: "beer",
};

/** Deterministic shuffle so different seeds (e.g. track URL) give different recommendation order/set */
function seededShuffle<T>(arr: T[], seed: string): T[] {
  const out = [...arr];
  let h = seed.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0);
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

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
    pricings: [
      { company: "Wine.com", price: "$18.99", url: "https://www.wine.com" },
      { company: "Total Wine", price: "$16.49", url: "https://www.totalwine.com" },
      { company: "Drizly", price: "$19.99", url: "https://www.drizly.com" },
    ],
  },
  {
    name: "Chardonnay",
    img: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=200",
    style: "White",
    buy: "https://www.wine.com",
    type: "wine",
    pricings: [
      { company: "Wine.com", price: "$14.99", url: "https://www.wine.com" },
      { company: "Vivino", price: "$13.50", url: "https://www.vivino.com" },
      { company: "Total Wine", price: "$15.99", url: "https://www.totalwine.com" },
    ],
  },
  {
    name: "Rosé",
    img: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=200",
    style: "Rosé",
    buy: "https://www.wine.com",
    type: "wine",
    pricings: [
      { company: "Wine.com", price: "$12.99", url: "https://www.wine.com" },
      { company: "Drizly", price: "$14.49", url: "https://www.drizly.com" },
    ],
  },
  {
    name: "Prosecco",
    img: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=200",
    style: "Sparkling",
    buy: "https://www.wine.com",
    type: "wine",
    pricings: [
      { company: "Wine.com", price: "$14.99", url: "https://www.wine.com" },
      { company: "Total Wine", price: "$12.99", url: "https://www.totalwine.com" },
    ],
  },
  {
    name: "Malbec",
    img: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=200",
    style: "Red",
    buy: "https://www.wine.com",
    type: "wine",
    pricings: [
      { company: "Vivino", price: "$11.99", url: "https://www.vivino.com" },
      { company: "Drizly", price: "$13.49", url: "https://www.drizly.com" },
    ],
  },
];

const WHISKIES: Drink[] = [
  {
    name: "Single Malt Scotch",
    img: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=200",
    style: "Single Malt",
    buy: "https://www.thewhiskyexchange.com",
    type: "whisky",
    pricings: [
      { company: "The Whisky Exchange", price: "£42.00", url: "https://www.thewhiskyexchange.com" },
      { company: "Master of Malt", price: "£38.50", url: "https://www.masterofmalt.com" },
      { company: "Drizly", price: "$48.99", url: "https://www.drizly.com" },
    ],
  },
  {
    name: "Bourbon",
    img: "https://images.unsplash.com/photo-1579684947550-22e945225d9a?w=200",
    style: "Bourbon",
    buy: "https://www.thewhiskyexchange.com",
    type: "whisky",
    pricings: [
      { company: "The Whisky Exchange", price: "£35.00", url: "https://www.thewhiskyexchange.com" },
      { company: "Total Wine", price: "$32.99", url: "https://www.totalwine.com" },
    ],
  },
  {
    name: "Irish Whiskey",
    img: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=200",
    style: "Irish",
    buy: "https://www.thewhiskyexchange.com",
    type: "whisky",
    pricings: [
      { company: "The Whisky Exchange", price: "£28.00", url: "https://www.thewhiskyexchange.com" },
      { company: "Drizly", price: "$34.99", url: "https://www.drizly.com" },
      { company: "Master of Malt", price: "£26.00", url: "https://www.masterofmalt.com" },
    ],
  },
  {
    name: "Rye Whiskey",
    img: "https://images.unsplash.com/photo-1579684947550-22e945225d9a?w=200",
    style: "Rye",
    buy: "https://www.thewhiskyexchange.com",
    type: "whisky",
    pricings: [
      { company: "The Whisky Exchange", price: "£32.00", url: "https://www.thewhiskyexchange.com" },
      { company: "Total Wine", price: "$29.99", url: "https://www.totalwine.com" },
    ],
  },
  {
    name: "Japanese Whisky",
    img: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=200",
    style: "Blended",
    buy: "https://www.thewhiskyexchange.com",
    type: "whisky",
    pricings: [
      { company: "Master of Malt", price: "£45.00", url: "https://www.masterofmalt.com" },
      { company: "Drizly", price: "$52.99", url: "https://www.drizly.com" },
    ],
  },
];

const CIDERS: Drink[] = [
  {
    name: "Rekorderlig Strawberry-Lime",
    img: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=200",
    style: "Fruit Cider",
    buy: "https://www.amazon.com/s?k=cider",
    type: "cider",
    pricings: [
      { company: "Amazon", price: "£2.49", url: "https://www.amazon.com/s?k=cider" },
      { company: "Beerwulf", price: "€2.99", url: "https://www.beerwulf.com" },
    ],
  },
  {
    name: "Thatchers Gold",
    img: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=200",
    style: "Dry Cider",
    buy: "https://www.amazon.com/s?k=cider",
    type: "cider",
    pricings: [
      { company: "Amazon", price: "£3.19", url: "https://www.amazon.com/s?k=cider" },
      { company: "Tesco", price: "£2.89", url: "https://www.tesco.com" },
    ],
  },
  {
    name: "Strongbow Dark Fruit",
    img: "https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=200",
    style: "Fruit Cider",
    buy: "https://www.amazon.com/s?k=cider",
    type: "cider",
    pricings: [
      { company: "Amazon", price: "£2.99", url: "https://www.amazon.com/s?k=cider" },
      { company: "Drizly", price: "$4.99", url: "https://www.drizly.com" },
    ],
  },
];

type Beer = { name: string; img: string; style: string; buy: string };

/** Attach 2–3 company pricings to a beer (primary buy link + alternatives). */
function beerPricings(beer: Beer): Pricing[] {
  let primary = "Store";
  try {
    primary = new URL(beer.buy).hostname.replace(/^www\./, "");
  } catch {
    // keep "Store"
  }
  return [
    { company: primary, price: "€4.99", url: beer.buy },
    { company: "Beerwulf", price: "€5.49", url: "https://www.beerwulf.com" },
    { company: "Amazon", price: "£5.99", url: "https://www.amazon.com/s?k=beer" },
  ];
}

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

type ConnectionEntry = {
  id: string;
  trackOrPlaylist: string;
  drinkName: string;
  timestamp: string;
};
const historyByUser = new Map<string, ConnectionEntry[]>();
const MAX_HISTORY = 20;

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
  async fetch(req) {
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
      const seed = url.searchParams.get("seed") ?? "";
      const alcoholType = mood && VIBE_TO_ALCOHOL_TYPE[mood] ? VIBE_TO_ALCOHOL_TYPE[mood] : "beer";

      let drinks: Drink[];
      if (alcoholType === "whisky") {
        drinks = seed ? seededShuffle([...WHISKIES], seed) : [...WHISKIES];
      } else if (alcoholType === "wine") {
        drinks = seed ? seededShuffle([...WINES], seed) : [...WINES];
      } else if (alcoholType === "cider") {
        drinks = seed ? seededShuffle([...CIDERS], seed) : [...CIDERS];
      } else {
        const primary = BEERS_BY_COUNTRY[country] ?? DEFAULT_BEERS;
        const otherCountry =
          COUNTRIES[
            (COUNTRIES.indexOf(country as (typeof COUNTRIES)[number]) + 1) % COUNTRIES.length
          ];
        const secondary = BEERS_BY_COUNTRY[otherCountry] ?? DEFAULT_BEERS;
        const seen = new Set<string>();
        let beers = [...primary, ...secondary].filter((b) => {
          if (seen.has(b.name)) return false;
          seen.add(b.name);
          return true;
        });
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
        drinks = beers.map((b) => ({
          ...b,
          type: "beer" as const,
          pricings: beerPricings(b),
        }));
        if (seed) drinks = seededShuffle(drinks, seed);
      }
      const minThree =
        drinks.length >= 3 ? drinks.slice(0, 3) : [...drinks, ...drinks, ...drinks].slice(0, 3);
      return Response.json(minThree, { headers: CORS });
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
      // Record connection history if body provided
      try {
        const body = await req.json().catch(() => ({}));
        const trackOrPlaylist = (body.trackOrPlaylist as string) || "Track";
        const drinkName = (body.drinkName as string) || "Pairing";
        const list = historyByUser.get(userId) ?? [];
        list.unshift({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          trackOrPlaylist,
          drinkName,
          timestamp: new Date().toISOString(),
        });
        historyByUser.set(userId, list.slice(0, MAX_HISTORY));
      } catch {
        // ignore
      }
      return Response.json({ points: profile.points, level: profile.level }, { headers: CORS });
    }
    if (url.pathname === "/history" && req.method === "GET") {
      const list = historyByUser.get(userId) ?? [];
      return Response.json(list, { headers: CORS });
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
