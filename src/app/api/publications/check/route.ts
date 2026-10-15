import { LINK_MESSAGES, parseSocialLink } from "@/lib/social/links";
import { verifyPublication } from "@/lib/social/meta";

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("url") ?? "";
  const link = parseSocialLink(raw);

  if (!link.ok) {
    return Response.json({ ok: false, reason: link.reason, message: LINK_MESSAGES[link.reason] }, { status: 400 });
  }

  const verification = await verifyPublication(link);

  if (verification.state === "unreachable") {
    return Response.json(
      { ok: false, reason: "unreachable", network: link.network, url: link.url, message: "Publication introuvable ou privée. Passez-la en public puis réessayez." },
      { status: 422 },
    );
  }

  return Response.json({
    ok: true,
    network: link.network,
    url: link.url,
    verification: verification.state,
    author: verification.state === "verified" ? verification.author ?? null : null,
  });
}
