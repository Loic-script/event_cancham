import { storeToken } from "@/lib/social/facebook";

export async function POST() {
  await storeToken(null);
  return Response.json({ ok: true });
}
