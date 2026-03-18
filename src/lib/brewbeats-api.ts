import { getSupabaseServerClient, getTableName } from "@/lib/supabase";

export type Vibe = {
  energy: number;
  mood: "chill" | "party" | "melancholic" | "uplifting" | "intense" | "groovy" | "romantic";
  tempo: "slow" | "medium" | "fast";
};

export type AnalyzeResult = {
  genre: string;
  country: string;
  vibe: Vibe;
  isPlaylist: boolean;
};

export type Pricing = { company: string; price: string; url: string };
export type DrinkType = "beer" | "wine" | "whisky" | "cider";
export type Drink = {
  name: string;
  img: string;
  style: string;
  buy: string;
  type: DrinkType;
  pricings: Pricing[];
};

export type Profile = {
  userId: string;
  points: number;
  level: string;
  levelIndex: number;
  streak: number;
  lastSessionDate: string | null;
  badges: string[];
};

export type LeaderboardEntry = {
  userId: string;
  points: number;
  level: string;
};

export type ConnectionEntry = {
  id: string;
  trackOrPlaylist: string;
  drinkName: string;
  timestamp: string;
};

const COUNTRIES = ["DE", "US", "GB", "BE", "CZ", "IE"] as const;
const GENRES = ["Rock", "Electronic", "Folk", "Jazz", "Hip-Hop", "Indie"] as const;

const VIBE_TO_ALCOHOL_TYPE: Record<Vibe["mood"], DrinkType> = {
  melancholic: "whisky",
  romantic: "wine",
  uplifting: "cider",
  chill: "cider",
  party: "beer",
  intense: "beer",
  groovy: "beer",
};

const VIBE_TO_BEER_STYLES: Record<Vibe["mood"], string[]> = {
  party: ["IPA", "Pale Ale", "Belgian Strong", "Tripel"],
  intense: ["IPA", "Stout", "Doppelbock"],
  uplifting: ["Pale Ale", "Hefeweizen", "ESB"],
  groovy: ["Lager", "Red Ale", "Pilsner"],
  chill: ["Pilsner", "Lager", "Hefeweizen", "ESB"],
  melancholic: ["Stout", "Dubbel", "Dark Lager"],
  romantic: ["Dubbel", "Belgian Strong"],
};

const BEERS_BY_COUNTRY: Record<string, Omit<Drink, "type" | "pricings">[]> = {
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

const WINES: Omit<Drink, "type" | "pricings">[] = [
  {
    name: "Pinot Noir",
    img: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=200",
    style: "Red",
    buy: "https://www.wine.com",
  },
  {
    name: "Chardonnay",
    img: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=200",
    style: "White",
    buy: "https://www.wine.com",
  },
  {
    name: "Prosecco",
    img: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=200",
    style: "Sparkling",
    buy: "https://www.wine.com",
  },
];

const WHISKIES: Omit<Drink, "type" | "pricings">[] = [
  {
    name: "Single Malt Scotch",
    img: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=200",
    style: "Single Malt",
    buy: "https://www.thewhiskyexchange.com",
  },
  {
    name: "Bourbon",
    img: "https://images.unsplash.com/photo-1579684947550-22e945225d9a?w=200",
    style: "Bourbon",
    buy: "https://www.thewhiskyexchange.com",
  },
  {
    name: "Irish Whiskey",
    img: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=200",
    style: "Irish",
    buy: "https://www.thewhiskyexchange.com",
  },
];

const CIDERS: Omit<Drink, "type" | "pricings">[] = [
  {
    name: "Rekorderlig Strawberry-Lime",
    img: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=200",
    style: "Fruit Cider",
    buy: "https://www.amazon.com/s?k=cider",
  },
  {
    name: "Thatchers Gold",
    img: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=200",
    style: "Dry Cider",
    buy: "https://www.amazon.com/s?k=cider",
  },
  {
    name: "Strongbow Dark Fruit",
    img: "https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=200",
    style: "Fruit Cider",
    buy: "https://www.amazon.com/s?k=cider",
  },
];

const LEVELS = [
  { name: "Novice", min: 0 },
  { name: "Explorer", min: 100 },
  { name: "Master Brewer", min: 500 },
] as const;

const POINTS_PAIRING = 10;
const MAX_HISTORY = 20;

type PairingPayload = {
  trackOrPlaylist?: string;
  drinkName?: string;
};

type ProfileRow = {
  user_id: string;
  points: number;
  level: string;
  level_index: number;
  streak: number;
  last_session_date: string | null;
  badges: string[] | null;
};

type PairingHistoryRow = {
  id: string;
  user_id: string;
  track_or_playlist: string;
  drink_name: string;
  created_at: string;
};

type BrewBeatsGlobal = typeof globalThis & {
  __brewbeatsProfiles?: Map<string, Profile>;
  __brewbeatsHistory?: Map<string, ConnectionEntry[]>;
};

const globalStore = globalThis as BrewBeatsGlobal;
const profileStore =
  globalStore.__brewbeatsProfiles ?? (globalStore.__brewbeatsProfiles = new Map<string, Profile>());
const historyStore =
  globalStore.__brewbeatsHistory ??
  (globalStore.__brewbeatsHistory = new Map<string, ConnectionEntry[]>());

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return h;
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  const result = [...items];
  let h = hashString(seed);
  for (let i = result.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    const j = h % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function isPlaylistUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes("/playlist") || lower.includes("list=") || lower.includes("/sets/");
}

function buildPricings(type: DrinkType, buy: string): Pricing[] {
  if (type === "wine") {
    return [
      { company: "Wine.com", price: "$14.99", url: "https://www.wine.com" },
      { company: "Total Wine", price: "$16.49", url: "https://www.totalwine.com" },
      { company: "Drizly", price: "$18.99", url: "https://www.drizly.com" },
    ];
  }
  if (type === "whisky") {
    return [
      {
        company: "The Whisky Exchange",
        price: "GBP 39.00",
        url: "https://www.thewhiskyexchange.com",
      },
      { company: "Master of Malt", price: "GBP 36.50", url: "https://www.masterofmalt.com" },
      { company: "Drizly", price: "$47.99", url: "https://www.drizly.com" },
    ];
  }
  if (type === "cider") {
    return [
      { company: "Amazon", price: "GBP 2.99", url: "https://www.amazon.com/s?k=cider" },
      { company: "Beerwulf", price: "EUR 2.79", url: "https://www.beerwulf.com" },
      { company: "Drizly", price: "$4.99", url: "https://www.drizly.com" },
    ];
  }

  let company = "Store";
  try {
    company = new URL(buy).hostname.replace(/^www\./, "");
  } catch {
    company = "Store";
  }

  return [
    { company, price: "EUR 4.99", url: buy },
    { company: "Beerwulf", price: "EUR 5.49", url: "https://www.beerwulf.com" },
    { company: "Amazon", price: "$6.49", url: "https://www.amazon.com/s?k=beer" },
  ];
}

function withTypeAndPricing(type: DrinkType, item: Omit<Drink, "type" | "pricings">): Drink {
  return {
    ...item,
    type,
    pricings: buildPricings(type, item.buy),
  };
}

function pickBeerPool(country: string): Omit<Drink, "type" | "pricings">[] {
  return BEERS_BY_COUNTRY[country.toUpperCase()] ?? BEERS_BY_COUNTRY.DE;
}

function ensureProfile(userId: string): Profile {
  const existing = profileStore.get(userId);
  if (existing) {
    return existing;
  }

  const created: Profile = {
    userId,
    points: 0,
    level: LEVELS[0].name,
    levelIndex: 0,
    streak: 0,
    lastSessionDate: null,
    badges: [],
  };

  profileStore.set(userId, created);
  return created;
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
  if (profile.lastSessionDate === today) {
    return;
  }

  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  profile.streak = profile.lastSessionDate === yesterday ? profile.streak + 1 : 1;
  profile.lastSessionDate = today;
}

function moodFromHash(hash: number): Vibe["mood"] {
  const moods: Vibe["mood"][] = [
    "chill",
    "party",
    "melancholic",
    "uplifting",
    "intense",
    "groovy",
    "romantic",
  ];
  return moods[Math.abs(hash) % moods.length];
}

function tempoFromHash(hash: number): Vibe["tempo"] {
  const tempos: Vibe["tempo"][] = ["slow", "medium", "fast"];
  return tempos[Math.abs(hash >> 2) % tempos.length];
}

export function analyzeUrl(url: string): AnalyzeResult {
  const hash = hashString(url);
  const mood = moodFromHash(hash);
  const energyMap: Record<Vibe["mood"], number> = {
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
      energy: energyMap[mood],
      mood,
      tempo: tempoFromHash(hash),
    },
    isPlaylist: isPlaylistUrl(url),
  };
}

export function recommendDrinks({
  country,
  mood,
  seed,
}: {
  country: string;
  mood: string;
  seed: string;
}): Drink[] {
  const normalizedMood = (mood.toLowerCase() || "party") as Vibe["mood"];
  const alcoholType = VIBE_TO_ALCOHOL_TYPE[normalizedMood] ?? "beer";

  let pool: Drink[] = [];
  if (alcoholType === "wine") {
    pool = WINES.map((item) => withTypeAndPricing("wine", item));
  } else if (alcoholType === "whisky") {
    pool = WHISKIES.map((item) => withTypeAndPricing("whisky", item));
  } else if (alcoholType === "cider") {
    pool = CIDERS.map((item) => withTypeAndPricing("cider", item));
  } else {
    const beers = pickBeerPool(country);
    const preferredStyles = new Set((VIBE_TO_BEER_STYLES[normalizedMood] ?? []).map((s) => s.toLowerCase()));
    const sorted = [...beers].sort((a, b) => {
      const aMatch = preferredStyles.has(a.style.toLowerCase()) ? 1 : 0;
      const bMatch = preferredStyles.has(b.style.toLowerCase()) ? 1 : 0;
      return bMatch - aMatch;
    });
    pool = sorted.map((item) => withTypeAndPricing("beer", item));
  }

  if (seed) {
    pool = seededShuffle(pool, seed);
  }

  if (pool.length >= 3) {
    return pool.slice(0, 3);
  }

  return [...pool, ...pool, ...pool].slice(0, 3);
}

export function resolveUserId(request: Request): string {
  const url = new URL(request.url);
  return url.searchParams.get("userId") ?? request.headers.get("x-user-id") ?? "default";
}

function mapProfileRow(row: ProfileRow): Profile {
  return {
    userId: row.user_id,
    points: row.points,
    level: row.level,
    levelIndex: row.level_index,
    streak: row.streak,
    lastSessionDate: row.last_session_date,
    badges: row.badges ?? [],
  };
}

async function ensureSupabaseProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const table = getTableName("profiles");
  const { data, error } = await supabase
    .from(table)
    .select("user_id, points, level, level_index, streak, last_session_date, badges")
    .eq("user_id", userId)
    .returns<ProfileRow>()
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  if (data) {
    return mapProfileRow(data);
  }

  const created: Profile = {
    userId,
    points: 0,
    level: LEVELS[0].name,
    levelIndex: 0,
    streak: 0,
    lastSessionDate: null,
    badges: [],
  };

  const { error: insertError } = await supabase.from(table).insert({
    user_id: created.userId,
    points: created.points,
    level: created.level,
    level_index: created.levelIndex,
    streak: created.streak,
    last_session_date: created.lastSessionDate,
    badges: created.badges,
  });

  if (insertError) {
    throw new Error(`Failed to create profile: ${insertError.message}`);
  }

  return created;
}

export async function getProfile(userId: string): Promise<Profile> {
  const supabaseProfile = await ensureSupabaseProfile(userId);
  if (supabaseProfile) {
    return supabaseProfile;
  }

  const profile = ensureProfile(userId);
  updateLevel(profile);
  return profile;
}

export async function markPairingTried(
  userId: string,
  payload: PairingPayload,
): Promise<{ points: number; level: string }> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const profile = await ensureSupabaseProfile(userId);
    if (!profile) {
      throw new Error("Supabase profile initialization failed.");
    }

    profile.points += POINTS_PAIRING;
    updateStreak(profile);
    updateLevel(profile);

    const profilesTable = getTableName("profiles");
    const historyTable = getTableName("pairing_history");
    const nowIso = new Date().toISOString();

    const { error: updateError } = await supabase
      .from(profilesTable)
      .update({
        points: profile.points,
        level: profile.level,
        level_index: profile.levelIndex,
        streak: profile.streak,
        last_session_date: profile.lastSessionDate,
        badges: profile.badges,
        updated_at: nowIso,
      })
      .eq("user_id", userId);

    if (updateError) {
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    const { error: historyError } = await supabase.from(historyTable).insert({
      id: crypto.randomUUID(),
      user_id: userId,
      track_or_playlist: payload.trackOrPlaylist || "Track",
      drink_name: payload.drinkName || "Pairing",
      created_at: nowIso,
    });

    if (historyError) {
      throw new Error(`Failed to insert pairing history: ${historyError.message}`);
    }

    return { points: profile.points, level: profile.level };
  }

  const fallbackProfile = ensureProfile(userId);
  fallbackProfile.points += POINTS_PAIRING;
  updateStreak(fallbackProfile);
  updateLevel(fallbackProfile);

  const list = historyStore.get(userId) ?? [];
  list.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    trackOrPlaylist: payload.trackOrPlaylist || "Track",
    drinkName: payload.drinkName || "Pairing",
    timestamp: new Date().toISOString(),
  });
  historyStore.set(userId, list.slice(0, MAX_HISTORY));

  return { points: fallbackProfile.points, level: fallbackProfile.level };
}

export async function getHistory(userId: string): Promise<ConnectionEntry[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const table = getTableName("pairing_history");
    const { data, error } = await supabase
      .from(table)
      .select("id, user_id, track_or_playlist, drink_name, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(MAX_HISTORY)
      .returns<PairingHistoryRow[]>();

    if (error) {
      throw new Error(`Failed to fetch history: ${error.message}`);
    }

    return (data ?? []).map((entry) => ({
      id: entry.id,
      trackOrPlaylist: entry.track_or_playlist,
      drinkName: entry.drink_name,
      timestamp: entry.created_at,
    }));
  }

  return historyStore.get(userId) ?? [];
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const table = getTableName("profiles");
    const { data, error } = await supabase
      .from(table)
      .select("user_id, points, level")
      .order("points", { ascending: false })
      .limit(10);

    if (error) {
      throw new Error(`Failed to fetch leaderboard: ${error.message}`);
    }

    return (data ?? []).map((entry) => ({
      userId: String(entry.user_id),
      points: Number(entry.points),
      level: String(entry.level),
    }));
  }

  return Array.from(profileStore.values())
    .sort((a, b) => b.points - a.points)
    .slice(0, 10)
    .map((profile) => ({
      userId: profile.userId,
      points: profile.points,
      level: profile.level,
    }));
}
