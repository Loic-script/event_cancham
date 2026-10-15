import type { ParsedLink } from "./links";

export type Verification =
  | { state: "disabled" }
  | { state: "verified"; author?: string }
  | { state: "unreachable" }
  | { state: "error" };

const VERSION = process.env.META_GRAPH_VERSION ?? "v23.0";

export function metaConfigured() {
  return Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);
}

export async function verifyPublication(link: Extract<ParsedLink, { ok: true }>): Promise<Verification> {
  if (!metaConfigured()) return { state: "disabled" };

  const token = `${process.env.META_APP_ID}|${process.env.META_APP_SECRET}`;
  const endpoint = link.network === "instagram" ? "instagram_oembed" : "oembed_post";
  const params = new URLSearchParams({ url: link.url, omitscript: "true", access_token: token });

  try {
    const response = await fetch(`https://graph.facebook.com/${VERSION}/${endpoint}?${params.toString()}`, {
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (response.ok) {
      const data = (await response.json()) as { author_name?: string };
      return { state: "verified", author: data.author_name };
    }
    if (response.status === 400 || response.status === 404) return { state: "unreachable" };
    return { state: "error" };
  } catch {
    return { state: "error" };
  }
}

