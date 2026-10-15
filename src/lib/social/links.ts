export type SocialNetwork = "facebook" | "instagram";

export type LinkFailure = "empty" | "invalid" | "network" | "profile";

export type ParsedLink =
  | { ok: true; network: SocialNetwork; url: string; embedSrc: string; label: string }
  | { ok: false; reason: LinkFailure };

export const LINK_MESSAGES: Record<LinkFailure, string> = {
  empty: "Collez le lien de votre publication.",
  invalid: "Ce lien n’est pas valide. Copiez-le depuis le menu Partager de votre publication.",
  network: "Le lien doit pointer vers une publication Facebook ou Instagram.",
  profile: "Ce lien mène à un profil ou une page, pas à une publication. Ouvrez la publication puis copiez son lien.",
};

const FACEBOOK_HOSTS = ["facebook.com", "fb.com", "fb.watch"];
const INSTAGRAM_HOSTS = ["instagram.com", "instagr.am"];
const KEEP_PARAMS = ["story_fbid", "id", "fbid", "set", "v"];

function hostMatches(host: string, list: string[]) {
  return list.some((h) => host === h || host.endsWith(`.${h}`));
}

function toUrl(raw: string): URL | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
}

function parseInstagram(u: URL): ParsedLink {
  const match = u.pathname.match(/\/(p|reel|reels|tv)\/([A-Za-z0-9_-]{5,})/);
  if (!match) return { ok: false, reason: "profile" };
  const type = match[1] === "reels" ? "reel" : match[1];
  const code = match[2];
  return {
    ok: true,
    network: "instagram",
    url: `https://www.instagram.com/${type}/${code}/`,
    embedSrc: `https://www.instagram.com/${type}/${code}/embed/captioned/`,
    label: "Instagram",
  };
}

function parseFacebook(u: URL): ParsedLink {
  const path = u.pathname.replace(/\/+$/, "");
  const isShort = u.hostname.toLowerCase() === "fb.watch";
  const queryPost = /^\/(permalink|story|photo)(\.php)?$/.test(path);
  const pathPost = /\/(posts|photos|videos|reel|watch|share\/(p|v|r))\/[^/]+/.test(path);
  const watchQuery = path === "/watch" && u.searchParams.has("v");
  const shortLink = isShort && path.length > 1;

  if (!(shortLink || watchQuery || pathPost || (queryPost && (u.searchParams.has("story_fbid") || u.searchParams.has("fbid"))))) {
    return { ok: false, reason: "profile" };
  }

  const clean = new URL(`https://www.facebook.com${isShort ? `/watch/${path.slice(1)}` : path}`);
  if (queryPost || watchQuery) {
    for (const key of KEEP_PARAMS) {
      const value = u.searchParams.get(key);
      if (value) clean.searchParams.set(key, value);
    }
  }
  const href = isShort ? `https://fb.watch${path}/` : clean.toString();
  const isVideo = isShort || /\/(videos|reel|watch)\b/.test(path) || /\/share\/(v|r)\//.test(path);
  const plugin = isVideo ? "video" : "post";

  return {
    ok: true,
    network: "facebook",
    url: href,
    embedSrc: `https://www.facebook.com/plugins/${plugin}.php?href=${encodeURIComponent(href)}&show_text=true&width=500&locale=fr_FR`,
    label: "Facebook",
  };
}

export function parseSocialLink(raw: string): ParsedLink {
  if (!raw.trim()) return { ok: false, reason: "empty" };
  const u = toUrl(raw);
  if (!u || !u.hostname.includes(".")) return { ok: false, reason: "invalid" };
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  if (hostMatches(host, INSTAGRAM_HOSTS)) return parseInstagram(u);
  if (hostMatches(host, FACEBOOK_HOSTS)) return parseFacebook(u);
  return { ok: false, reason: "network" };
}
