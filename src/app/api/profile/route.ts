import { getProfile, resolveUserId } from "@/lib/brewbeats-api";

export async function GET(request: Request): Promise<Response> {
  const userId = resolveUserId(request);
  const profile = await getProfile(userId);
  return Response.json(profile);
}
