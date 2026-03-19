/**
 * BrewBeats Beer Matcher
 * GET /beers?country=DE&mood=party&energy=0.8 → [{ name, img, style, buy }]
 * Recommends beers based on song vibe first (mood + energy), then country.
 */

export {};

const PORT = 4002;

type Beer = { name: string; img: string; style: string; buy: string };

/** Vibe → beer styles that match. Used to recommend alcohol from song vibe. */
const VIBE_TO_STYLES: Record<string, string[]> = {
  party: ["IPA", "Pale Ale", "Belgian Strong", "Tripel"],
  intense: ["IPA", "Stout", "Doppelbock"],
  uplifting: ["Pale Ale", "Hefeweizen", "ESB"],
  groovy: ["Lager", "Red Ale", "Pilsner"],
  chill: ["Pilsner", "Lager", "Hefeweizen", "ESB"],
  melancholic: ["Stout", "Dubbel", "Dark Lager"],
};

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

const DEFAULT_BEERS: Beer[] = BEERS_BY_COUNTRY.DE;

const server = Bun.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }
    if (url.pathname === "/beers" && req.method === "GET") {
      const country = (url.searchParams.get("country") ?? "DE").toUpperCase();
      const mood = url.searchParams.get("mood") ?? "";
      let beers = BEERS_BY_COUNTRY[country] ?? DEFAULT_BEERS;

      // Recommend by vibe first: filter beers whose style matches the song's mood
      if (mood && VIBE_TO_STYLES[mood]) {
        const preferredStyles = new Set(VIBE_TO_STYLES[mood].map((s) => s.toLowerCase()));
        const matching = beers.filter((b) => preferredStyles.has(b.style.toLowerCase()));
        if (matching.length > 0) {
          beers = matching;
        } else {
          // No exact match: sort so vibe-matched styles come first
          beers = [...beers].sort((a, b) => {
            const aMatch = preferredStyles.has(a.style.toLowerCase());
            const bMatch = preferredStyles.has(b.style.toLowerCase());
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return 0;
          });
        }
      }

      return Response.json(beers, {
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Beer Matcher http://localhost:${server.port}`);
