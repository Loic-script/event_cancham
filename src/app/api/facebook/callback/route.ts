import { exchangeCode, storeToken } from "@/lib/social/facebook";
import { urlPublique } from "@/lib/url";

export async function GET(request: Request) {
  const url = new URL(request.url);
  let next = "/defis/tombola";
  try {
    const s = JSON.parse(Buffer.from(url.searchParams.get("state") ?? "", "base64url").toString("utf8")) as { next?: string };
    if (s.next && s.next.startsWith("/")) next = s.next;
  } catch {
    next = "/defis/tombola";
  }
  const code = url.searchParams.get("code");
  // Même adresse publique qu'au départ : Facebook vérifie que redirect_uri est identique à l'échange du code.
  const base = await urlPublique();
  if (!code) return Response.redirect(`${base}${next}?facebook=refus`, 302);
  try {
    const token = await exchangeCode(base, code);
    await storeToken(token);
    return Response.redirect(`${base}${next}?facebook=ok`, 302);
  } catch {
    return Response.redirect(`${base}${next}?facebook=erreur`, 302);
  }
}
