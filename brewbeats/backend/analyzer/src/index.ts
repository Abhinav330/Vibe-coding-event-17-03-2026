/**
 * BrewBeats Audio Analyzer
 * POST /analyze?url=... → { genre, country }
 * Stub: derives mock genre/country from URL for now.
 */

const PORT = 4001;

// Mock: map URL patterns or random to country/genre
const COUNTRIES = ["DE", "US", "GB", "BE", "CZ", "IE"] as const;
const GENRES = ["Rock", "Electronic", "Folk", "Jazz", "Hip-Hop", "Indie"] as const;

function mockAnalyze(url: string): { genre: string; country: string } {
  const hash = url.split("").reduce((a, c) => (a + c.charCodeAt(0)) | 0, 0);
  return {
    genre: GENRES[Math.abs(hash) % GENRES.length],
    country: COUNTRIES[Math.abs(hash >> 4) % COUNTRIES.length],
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
