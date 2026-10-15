import { appConfigured, loginUrl } from "@/lib/social/facebook";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!appConfigured()) return Response.json({ ok: false, message: "Renseignez META_APP_ID et META_APP_SECRET." }, { status: 503 });
  const next = url.searchParams.get("next") ?? "/defis/tombola";
  const state = Buffer.from(JSON.stringify({ next, n: Math.random().toString(36).slice(2) })).toString("base64url");
  return Response.redirect(loginUrl(url.origin, state), 302);
}
