import { exchangeCode, storeToken } from "@/lib/social/facebook";

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
  if (!code) return Response.redirect(`${url.origin}${next}?facebook=refus`, 302);
  try {
    const token = await exchangeCode(url.origin, code);
    await storeToken(token);
    return Response.redirect(`${url.origin}${next}?facebook=ok`, 302);
  } catch {
    return Response.redirect(`${url.origin}${next}?facebook=erreur`, 302);
  }
}
