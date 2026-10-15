import { appConfigured, userToken, whoAmI } from "@/lib/social/facebook";

export async function GET() {
  if (!appConfigured()) return Response.json({ configured: false, connected: false });
  const token = await userToken();
  if (!token) return Response.json({ configured: true, connected: false });
  const me = await whoAmI(token);
  return Response.json({ configured: true, connected: Boolean(me), name: me?.name ?? null });
}
