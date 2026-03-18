import { getHistory, resolveUserId } from "@/lib/brewbeats-api";

export async function GET(request: Request): Promise<Response> {
  const userId = resolveUserId(request);
  const history = await getHistory(userId);
  return Response.json(history);
}
