import { listeConversations, listeEquipe } from "@/lib/messagerie";
import { json } from "@/lib/ressources/servir";
import { aAccesEspace, getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export type MessageNonLu = { id: string; nom: string; texte: string; nonLus: number; t: number; href: string };

/** Pastilles et notifications : conversations non lues du compte, et (administrateurs) de l'équipe. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !aAccesEspace(user)) return json(401, { ok: false });
  const admin = user.acces === "ADMIN";
  const [miennes, equipe] = await Promise.all([listeConversations(user.id), admin ? listeEquipe() : Promise.resolve([])]);
  const nonLues = (liste: typeof miennes, base: string): MessageNonLu[] =>
    liste.filter((c) => c.unread > 0).map((c) => ({ id: c.id, nom: c.name, texte: c.lastText, nonLus: c.unread, t: Date.parse(c.lastIso), href: `${base}/${c.id}` }));
  const conversations = admin ? nonLues(equipe, "/admin/messagerie") : nonLues(miennes, "/messages");
  return json(200, {
    ok: true,
    membre: miennes.reduce((t, c) => t + c.unread, 0),
    equipe: equipe.reduce((t, c) => t + c.unread, 0),
    conversations,
  });
}
