"use server";

import { revalidatePath } from "next/cache";
import { MAX_TEXTE_MESSAGE, accesConversation, ajouterMessage, auteurEstMoi, luParLAutre, marquerLu, messagesDe, vueMessage, type Cote, type MessageVue } from "@/lib/messagerie";
import { aAccesEspace, getCurrentUser } from "@/lib/session";

type Resultat<T> = { error: string | null } & Partial<T>;

const SANS_ACCES = "Votre session a expiré ou votre accès n’est pas encore validé.";
const INTROUVABLE = "Cette conversation n’existe plus.";

async function ouvrir(conversationId: unknown, cote: unknown) {
  const user = await getCurrentUser();
  if (!user || !aAccesEspace(user)) return { erreur: SANS_ACCES } as const;
  if (cote !== "membre" && cote !== "equipe") return { erreur: INTROUVABLE } as const;
  const c = await accesConversation(String(conversationId), user, cote);
  if (!c) return { erreur: INTROUVABLE } as const;
  return { user, c, cote: cote as Cote } as const;
}

function rafraichir() {
  revalidatePath("/messages", "layout");
  revalidatePath("/admin/messagerie", "layout");
}

export async function envoyerMessage(conversationId: string, cote: Cote, texte: string): Promise<Resultat<{ message: MessageVue }>> {
  const o = await ouvrir(conversationId, cote);
  if ("erreur" in o) return { error: o.erreur ?? INTROUVABLE };
  const propre = typeof texte === "string" ? texte.trim() : "";
  if (!propre) return { error: "Écrivez votre message." };
  if (propre.length > MAX_TEXTE_MESSAGE) return { error: `Le message ne doit pas dépasser ${MAX_TEXTE_MESSAGE} caractères.` };

  const m = await ajouterMessage(o.c, o.user.id, { texte: propre });
  await marquerLu(o.c, o.user, o.cote);
  rafraichir();
  return { error: null, message: vueMessage(m, auteurEstMoi(o.c, o.user, o.cote)) };
}

/** Conversation ouverte : nouveaux messages depuis `apres`, conversation marquée comme lue, et lecture de l'autre côté (« Vu »). */
export async function actualiserConversation(conversationId: string, cote: Cote, apres: string | null): Promise<Resultat<{ messages: MessageVue[]; vuJusqua: string | null }>> {
  const o = await ouvrir(conversationId, cote);
  if ("erreur" in o) return { error: o.erreur ?? INTROUVABLE };
  const depuis = apres ? new Date(apres) : undefined;
  const messages = await messagesDe(o.c.id, auteurEstMoi(o.c, o.user, o.cote), depuis && !Number.isNaN(depuis.getTime()) ? depuis : undefined);
  if (messages.some((m) => !m.fromMe)) await marquerLu(o.c, o.user, o.cote);
  return { error: null, messages, vuJusqua: luParLAutre(o.c, o.user, o.cote)?.toISOString() ?? null };
}
