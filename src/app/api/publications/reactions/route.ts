import { readReactions, userToken } from "@/lib/social/facebook";
import { LINK_MESSAGES, parseSocialLink } from "@/lib/social/links";
import { metaConfigured } from "@/lib/social/meta";

const MESSAGES = {
  disabled: "Relevé automatique non configuré : renseignez META_APP_ID et META_APP_SECRET.",
  not_connected: "Connectez votre compte Facebook pour relever les réactions de votre publication.",
  instagram: "Instagram ne communique pas les réactions d’un compte personnel.",
  group: "Cette publication est dans un groupe : Facebook n’en communique pas les réactions. Publiez sur votre profil, en mode Public.",
  not_found: "Publication introuvable parmi vos publications. Vérifiez qu’elle est sur votre profil et que vous avez accepté l’accès à vos publications.",
  error: "Facebook n’a pas répondu. Réessayez dans un instant.",
};

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("url") ?? "";
  const link = parseSocialLink(raw);
  if (!link.ok) return Response.json({ ok: false, reason: link.reason, message: LINK_MESSAGES[link.reason] }, { status: 400 });
  if (!metaConfigured()) return Response.json({ ok: false, reason: "disabled", message: MESSAGES.disabled });
  const token = await userToken();
  if (!token) return Response.json({ ok: false, reason: "not_connected", message: MESSAGES.not_connected });
  const result = await readReactions(link, token);
  if (!result.ok) return Response.json({ ok: false, reason: result.reason, message: MESSAGES[result.reason], detail: result.detail ?? null }, { status: result.reason === "error" ? 502 : 200 });
  return Response.json({ ok: true, reactions: result.reactions, comments: result.comments, shares: result.shares, at: result.at });
}
