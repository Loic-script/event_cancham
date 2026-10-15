import { permissions, userToken } from "@/lib/social/facebook";
import { parseSocialLink } from "@/lib/social/links";

const VERSION = process.env.META_GRAPH_VERSION ?? "v23.0";

async function graph(path: string, params: Record<string, string>) {
  const p = new URLSearchParams(params);
  const r = await fetch(`https://graph.facebook.com/${VERSION}/${path}?${p.toString()}`, { cache: "no-store" });
  return { status: r.status, body: await r.json() };
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });
  const token = await userToken();
  if (!token) return Response.json({ connected: false });
  const raw = new URL(request.url).searchParams.get("url") ?? "";
  const link = parseSocialLink(raw);
  const droits = await permissions(token);
  const posts = await graph("me/posts", { fields: "id,permalink_url,created_time,message", limit: "10", access_token: token });
  const photos = await graph("me/photos", { fields: "id,link,created_time", type: "uploaded", limit: "10", access_token: token });
  const fbid = link.ok ? link.url.match(/[?&]fbid=(\d+)/)?.[1] : undefined;
  const direct = fbid ? await graph(fbid, { fields: "id,reactions.summary(total_count),comments.summary(total_count)", access_token: token }) : null;
  return Response.json({ droits, lien: link.ok ? link.url : raw, fbid: fbid ?? null, direct, posts: posts.body, photos: photos.body });
}
