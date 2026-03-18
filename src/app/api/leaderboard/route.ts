import { getLeaderboard } from "@/lib/brewbeats-api";

export async function GET(): Promise<Response> {
  const leaderboard = await getLeaderboard();
  return Response.json(leaderboard);
}
