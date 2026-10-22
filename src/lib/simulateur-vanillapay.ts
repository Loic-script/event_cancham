import { createHmac } from "node:crypto";

/**
 * Simulateur local de Vanilla Pay (VANILLAPAY_BASE=http://localhost:3000/simulateur-vanillapay) : mêmes routes que le prestataire,
 * une page « payer » avec deux boutons, et une notification signée envoyée à notif_url. Jamais en production.
 */
export const SIMULATEUR_ACTIF = process.env.NODE_ENV !== "production" || process.env.VANILLAPAY_SIMULATEUR === "1";

export type Transaction = { transaction: string; montant: number; reference: string; panier: string; notifUrl: string; redirectUrl: string; modePaiement: string; etat: "INITIATED" | "SUCCESS" | "FAILED"; creeLe: number };

declare global {
  // Partagé entre les routes du simulateur dans le même processus.
  var transactionsSimulees: Map<string, Transaction> | undefined;
}

export const transactions = (globalThis.transactionsSimulees ??= new Map<string, Transaction>());

export const JETON_SIMULE = "jeton-simule";

export function identifiantsValides(h: Headers): boolean {
  return h.get("client-id") === process.env.VANILLAPAY_CLIENT_ID && h.get("client-secret") === process.env.VANILLAPAY_CLIENT_SECRET;
}

export const jetonValide = (h: Headers) => h.get("authorization") === `Bearer ${JETON_SIMULE}`;

export const reponse = (code: number, desc: string, Data: unknown = null, status = 200) => Response.json({ CodeRetour: code, DescRetour: desc, DetailRetour: desc, Data }, { status });

/** Adresse de paiement : id = xxx.<transaction en base64url>.zzz, comme chez le prestataire. */
export function urlDePaiement(base: string, transaction: string): string {
  return `${base}/payer?id=${["sim", Buffer.from(transaction, "utf8").toString("base64url"), "sim"].join(".")}`;
}

export function transactionDepuisId(id: string | null): Transaction | null {
  const milieu = id?.split(".")[1];
  if (!milieu) return null;
  return transactions.get(Buffer.from(milieu, "base64url").toString("utf8")) ?? null;
}

/** Corps de notification tel que Vanilla Pay l'envoie, signé avec VANILLAPAY_KEY_SECRET. */
export function notification(t: Transaction, montantAnnonce = t.montant) {
  const corps = JSON.stringify({ reference_VPI: `VPI-${t.transaction}`, reference: t.reference, panier: t.panier, montant: montantAnnonce, montant_mga: t.modePaiement === "international" ? montantAnnonce : undefined, etat: t.etat, initiateur: "simulateur", referenceMM: t.modePaiement === "mobile_money" ? `MM-${t.transaction}` : undefined, date: new Date().toISOString() });
  const signature = createHmac("sha256", process.env.VANILLAPAY_KEY_SECRET ?? "").update(corps, "utf8").digest("hex").toUpperCase();
  return { corps, signature };
}

/** Envoie la notification signée à notif_url ; une erreur n'empêche pas le retour du payeur (la page de retour vérifie l'état). */
export async function notifier(t: Transaction, montantAnnonce?: number): Promise<void> {
  const { corps, signature } = notification(t, montantAnnonce);
  try {
    await fetch(t.notifUrl, { method: "POST", headers: { "Content-Type": "application/json", "VPI-Signature": signature }, body: corps, signal: AbortSignal.timeout(10_000) });
  } catch (e) {
    console.error("Simulateur Vanilla Pay : notification non remise :", e);
  }
}
