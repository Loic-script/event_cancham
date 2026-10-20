import { promises as fs } from "node:fs";
import path from "node:path";

export type Courriel = { a: string | string[]; sujet: string; texte: string; html: string };

/** Logo Impact 261 joint aux e-mails (image intégrée) : le HTML l'affiche avec src="cid:logo-impact". */
export const LOGO_CID = "logo-impact";

let logo: Promise<string | null> | null = null;

function logoBase64(): Promise<string | null> {
  logo ??= fs
    .readFile(path.join(process.cwd(), "public", "impact261", "logo-courriel.png"))
    .then((b) => b.toString("base64"))
    .catch((e) => {
      console.error("Logo des e-mails introuvable :", e);
      logo = null;
      return null;
    });
  return logo;
}

/** Envoi par l'API de Resend : RESEND_API_KEY, COURRIEL_EXPEDITEUR (domaine vérifié chez Resend) et COURRIEL_EQUIPE (adresse de réponse). */
export function courrielConfigure(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.COURRIEL_EXPEDITEUR);
}

/** En développement sans Resend, le message est écrit dans le terminal du serveur au lieu d'être envoyé. */
export function courrielDisponible(): boolean {
  return courrielConfigure() || process.env.NODE_ENV !== "production";
}

export async function envoyerCourriel({ a, sujet, texte, html }: Courriel): Promise<void> {
  if (!courrielConfigure()) {
    if (process.env.NODE_ENV === "production") throw new Error("Resend non configuré (RESEND_API_KEY ou COURRIEL_EXPEDITEUR manquant)");
    console.info(`\n[Courriel non envoyé : Resend non configuré]\nÀ : ${[a].flat().join(", ")}\nSujet : ${sujet}\n\n${texte}\n`);
    return;
  }
  const equipe = process.env.COURRIEL_EQUIPE?.trim();
  // Sans le fichier du logo, l'e-mail part quand même (le logo manquera).
  const contenuLogo = html.includes(`cid:${LOGO_CID}`) ? await logoBase64() : null;
  const pieces = contenuLogo ? [{ filename: "impact261.png", content: contenuLogo, content_id: LOGO_CID, content_type: "image/png" }] : [];
  const reponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.COURRIEL_EXPEDITEUR, to: Array.isArray(a) ? a : [a], subject: sujet, text: texte, html, ...(equipe ? { reply_to: equipe } : {}), ...(pieces.length ? { attachments: pieces } : {}) }),
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (!reponse.ok) throw new Error(`Resend ${reponse.status} : ${(await reponse.text()).slice(0, 300)}`);
}
