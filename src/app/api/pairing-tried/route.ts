import { markPairingTried, resolveUserId } from "@/lib/brewbeats-api";

type PairingTriedPayload = {
  trackOrPlaylist?: string;
  drinkName?: string;
};

export async function POST(request: Request): Promise<Response> {
  const userId = resolveUserId(request);

  let payload: PairingTriedPayload = {};
  try {
    const parsed = (await request.json()) as PairingTriedPayload;
    payload = parsed ?? {};
  } catch {
    payload = {};
  }

  const result = await markPairingTried(userId, payload);
  return Response.json(result);
}
