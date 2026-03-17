/**
 * BrewBeats Gamification
 * POST /pairing-tried → +10pts; GET /profile → points, level, streak, badges.
 * Levels: Novice 0, Explorer 100, Master Brewer 500.
 */

const PORT = 4003;

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
  if (profile.lastSessionDate === yesterday) {
    profile.streak += 1;
  } else {
    profile.streak = 1;
  }
  profile.lastSessionDate = today;
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    const userId = url.searchParams.get("userId") ?? req.headers.get("x-user-id") ?? "default";

    if (url.pathname === "/profile" && req.method === "GET") {
      const profile = ensureProfile(userId);
      updateLevel(profile);
      return Response.json(profile, { headers: cors });
    }

    if (url.pathname === "/pairing-tried" && req.method === "POST") {
      const profile = ensureProfile(userId);
      profile.points += POINTS_PAIRING;
      updateStreak(profile);
      updateLevel(profile);
      return Response.json({ points: profile.points, level: profile.level }, { headers: cors });
    }

    if (url.pathname === "/favorite" && req.method === "POST") {
      const profile = ensureProfile(userId);
      profile.points += POINTS_FAVORITE;
      updateStreak(profile);
      updateLevel(profile);
      return Response.json({ points: profile.points }, { headers: cors });
    }

    if (url.pathname === "/share" && req.method === "POST") {
      const profile = ensureProfile(userId);
      profile.points += POINTS_SHARE;
      updateStreak(profile);
      updateLevel(profile);
      return Response.json({ points: profile.points }, { headers: cors });
    }

    if (url.pathname === "/leaderboard" && req.method === "GET") {
      const top = Array.from(store.values())
        .sort((a, b) => b.points - a.points)
        .slice(0, 10)
        .map((p) => ({ userId: p.userId, points: p.points, level: p.level }));
      return Response.json(top, { headers: cors });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Gamify http://localhost:${server.port}`);
