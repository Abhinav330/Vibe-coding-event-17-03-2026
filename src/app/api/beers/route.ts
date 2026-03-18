import { recommendDrinks } from "@/lib/brewbeats-api";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const country = (url.searchParams.get("country") ?? "DE").toUpperCase();
  const mood = url.searchParams.get("mood") ?? "";
  const seed = url.searchParams.get("seed") ?? "";

  const recommendations = recommendDrinks({ country, mood, seed });
  return Response.json(recommendations);
}
