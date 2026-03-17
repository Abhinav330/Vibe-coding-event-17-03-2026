/**
 * BrewBeats Audio Analyzer
 * POST /analyze?url=... → { genre, country, vibe }
 * Reads the vibe of the song first (energy, mood, tempo); stub derives from URL for now.
 * Real impl could use Spotify Audio Features, Web Audio API, or external music API.
 */

const PORT = 4001;

const COUNTRIES = ["DE", "US", "GB", "BE", "CZ", "IE"] as const;
const GENRES = ["Rock", "Electronic", "Folk", "Jazz", "Hip-Hop", "Indie"] as const;

/** Vibe: how the track feels — used to recommend matching beers */
export type Vibe = {
  energy: number; // 0–1
  mood: "chill" | "party" | "melancholic" | "uplifting" | "intense" | "groovy";
  tempo: "slow" | "medium" | "fast";
};

function mockAnalyze(url: string): { genre: string; country: string; vibe: Vibe } {
  const hash = url.split("").reduce((a, c) => (a + c.charCodeAt(0)) | 0, 0);
  const moods: Vibe["mood"][] = ["chill", "party", "melancholic", "uplifting", "intense", "groovy"];
  const tempos: Vibe["tempo"][] = ["slow", "medium", "fast"];
  const mood = moods[Math.abs(hash) % moods.length];
  const tempo = tempos[Math.abs(hash >> 2) % tempos.length];
  // Energy: party/intense → high, chill/melancholic → low, rest → medium
  const energyMap: Record<string, number> = {
    party: 0.85,
    intense: 0.9,
    uplifting: 0.75,
    groovy: 0.65,
    chill: 0.35,
    melancholic: 0.25,
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

const server = Bun.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }
    if (url.pathname === "/analyze" && req.method === "POST") {
      const urlParam = url.searchParams.get("url") ?? "";
      if (!urlParam) {
        return Response.json({ error: "Missing url query parameter" }, { status: 400 });
      }
      const result = mockAnalyze(urlParam);
      return Response.json(result, {
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Analyzer http://localhost:${server.port}`);
