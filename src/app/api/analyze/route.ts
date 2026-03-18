import { analyzeUrl } from "@/lib/brewbeats-api";

export async function POST(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const inputUrl = url.searchParams.get("url")?.trim() ?? "";

  if (!inputUrl) {
    return Response.json({ error: "Missing url query parameter" }, { status: 400 });
  }

  return Response.json(analyzeUrl(inputUrl));
}
