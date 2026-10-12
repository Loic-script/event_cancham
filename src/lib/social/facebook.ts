import { cookies } from "next/headers";
import type { ParsedLink } from "./links";

export const FB_COOKIE = "fb_user_token";
const VERSION = process.env.META_GRAPH_VERSION ?? "v23.0";
function appId() {
  return process.env.META_BUSINESS_APP_ID || process.env.META_APP_ID || "";
}

function appSecret() {
  return process.env.META_BUSINESS_APP_SECRET || process.env.META_APP_SECRET || "";
}

function scopes() {
  return process.env.META_SCOPES || "public_profile";
}

export function appConfigured() {
  return Boolean(appId() && appSecret());
}

export function redirectUri(origin: string) {
  return process.env.META_REDIRECT_URI || `${origin}/api/facebook/callback`;
}

export function loginUrl(origin: string, state: string) {
  const p = new URLSearchParams({ client_id: appId(), redirect_uri: redirectUri(origin), scope: scopes(), response_type: "code", state });
  return `https://www.facebook.com/${VERSION}/dialog/oauth?${p.toString()}`;
}

async function graph<T>(path: string, params: Record<string, string>): Promise<T> {
  const p = new URLSearchParams(params);
  const r = await fetch(`https://graph.facebook.com/${VERSION}/${path}?${p.toString()}`, { signal: AbortSignal.timeout(10000), cache: "no-store" });
  const data = (await r.json()) as T & { error?: { message: string; code?: number } };
  if (!r.ok || data.error) throw new Error(data.error?.message ?? `Graph ${r.status}`);
  return data;
}

export async function exchangeCode(origin: string, code: string) {
  const court = await graph<{ access_token: string }>("oauth/access_token", { client_id: appId(), client_secret: appSecret(), redirect_uri: redirectUri(origin), code });
  const long = await graph<{ access_token: string; expires_in?: number }>("oauth/access_token", { grant_type: "fb_exchange_token", client_id: appId(), client_secret: appSecret(), fb_exchange_token: court.access_token });
  return long.access_token;
}

export async function userToken() {
  const jar = await cookies();
  return jar.get(FB_COOKIE)?.value ?? null;
}

export async function storeToken(token: string | null) {
  const jar = await cookies();
  if (!token) {
    jar.delete(FB_COOKIE);
    return;
  }
  jar.set(FB_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 24 * 3600 });
}

export async function whoAmI(token: string) {
  try {
    return await graph<{ id: string; name: string }>("me", { fields: "id,name", access_token: token });
  } catch {
    return null;
  }
}

type Summary = { summary?: { total_count?: number } };
type Engagement = { reactions?: Summary; comments?: Summary; shares?: { count?: number } };

function identifiants(url: string) {
  const ids = new Set<string>();
  for (const m of url.matchAll(/\d{8,}/g)) ids.add(m[0]);
  for (const m of url.matchAll(/pfbid[0-9A-Za-z]+/g)) ids.add(m[0]);
  return [...ids];
}

export type ReactionsResult = { ok: true; reactions: number; comments: number; shares: number; at: number } | { ok: false; reason: "disabled" | "not_connected" | "instagram" | "not_found" | "group" | "scope" | "error"; detail?: string };

export async function permissions(token: string): Promise<string[]> {
  try {
    const r = await graph<{ data: { permission: string; status: string }[] }>("me/permissions", { access_token: token });
    return r.data.filter((x) => x.status === "granted").map((x) => x.permission);
  } catch {
    return [];
  }
}

export async function readReactions(link: Extract<ParsedLink, { ok: true }>, token: string): Promise<ReactionsResult> {
  if (link.network === "instagram") return { ok: false, reason: "instagram" };
  if (/[?&]set=gm\./.test(link.url) || /\/groups\//.test(link.url)) return { ok: false, reason: "group" };
  const champs = "reactions.summary(total_count),comments.summary(total_count),shares";
  const ids = identifiants(link.url);
  const fbid = link.url.match(/[?&]fbid=(\d+)/)?.[1];

  const lire = async (id: string) => {
    const e = await graph<Engagement>(id, { fields: champs, access_token: token });
    return { ok: true as const, reactions: e.reactions?.summary?.total_count ?? 0, comments: e.comments?.summary?.total_count ?? 0, shares: e.shares?.count ?? 0, at: Date.now() };
  };

  if (fbid) {
    try {
      return await lire(fbid);
    } catch {
      return { ok: false, reason: "not_found" };
    }
  }

  try {
    let after: string | undefined;
    for (let page = 0; page < 4; page++) {
      const r = await graph<{ data: { id: string; permalink_url?: string }[]; paging?: { cursors?: { after?: string }; next?: string } }>("me/posts", { fields: "id,permalink_url", limit: "100", access_token: token, ...(after ? { after } : {}) });
      const trouve = r.data.find((p) => {
        const perm = p.permalink_url ?? "";
        const second = p.id.split("_")[1] ?? "";
        return ids.some((x) => perm.includes(x) || second === x);
      });
      if (trouve) return await lire(trouve.id);
      after = r.paging?.cursors?.after;
      if (!r.paging?.next || !after) break;
    }
    return { ok: false, reason: "not_found" };
  } catch (e) {
    return { ok: false, reason: "error", detail: e instanceof Error ? e.message : String(e) };
  }
}
