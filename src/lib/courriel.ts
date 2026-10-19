export type Courriel = { a: string; sujet: string; texte: string; html: string };

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
    console.info(`\n[Courriel non envoyé : Resend non configuré]\nÀ : ${a}\nSujet : ${sujet}\n\n${texte}\n`);
    return;
  }
  const equipe = process.env.COURRIEL_EQUIPE?.trim();
  const reponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.COURRIEL_EXPEDITEUR, to: [a], subject: sujet, text: texte, html, ...(equipe ? { reply_to: equipe } : {}) }),
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (!reponse.ok) throw new Error(`Resend ${reponse.status} : ${(await reponse.text()).slice(0, 300)}`);
}
