import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Client Vanilla Pay (paiement par carte et mobile money) : jeton, ouverture d'un paiement, état d'une transaction,
 * et lecture des notifications signées. Les clés restent côté serveur et ne sont jamais journalisées.
 */
export type ModeVanillaPay = "international" | "mobile_money";

export type Operateur = "MVOLA" | "ORANGE" | "AIRTEL";

type Reponse<T> = { CodeRetour?: number | string; DescRetour?: string; DetailRetour?: string; Data?: T };

export class ErreurVanillaPay extends Error {
  constructor(
    message: string,
    public readonly detail: string | null = null,
  ) {
    super(message);
    this.name = "ErreurVanillaPay";
  }
}

export const PRESTATAIRE_INJOIGNABLE = "Le prestataire de paiement ne répond pas, réessayez.";

function config() {
  const base = (process.env.VANILLAPAY_BASE ?? "https://bo.vanilla-pay.net").trim().replace(/\/+$/, "");
  return { base, clientId: process.env.VANILLAPAY_CLIENT_ID ?? "", clientSecret: process.env.VANILLAPAY_CLIENT_SECRET ?? "", keySecret: process.env.VANILLAPAY_KEY_SECRET ?? "", version: process.env.VANILLAPAY_VERSION ?? "2023-01-12" };
}

export function vanillaPayConfigure(): boolean {
  const c = config();
  return Boolean(c.clientId && c.clientSecret && c.keySecret);
}

async function lire<T>(reponse: Response): Promise<Reponse<T>> {
  const texte = await reponse.text();
  try {
    return JSON.parse(texte) as Reponse<T>;
  } catch {
    throw new ErreurVanillaPay(PRESTATAIRE_INJOIGNABLE, `réponse illisible (${reponse.status})`);
  }
}

/** Jeton d'accès (en-tête Authorization), gardé quelques minutes. */
let jetonEnCache: { valeur: string; expire: number } | null = null;

export async function jeton(): Promise<string> {
  if (jetonEnCache && jetonEnCache.expire > Date.now()) return jetonEnCache.valeur;
  const c = config();
  let reponse: Response;
  try {
    reponse = await fetch(`${c.base}/webpayment/token`, { headers: { Accept: "*/*", "Client-Id": c.clientId, "Client-Secret": c.clientSecret, "VPI-Version": c.version }, cache: "no-store", signal: AbortSignal.timeout(15_000) });
  } catch {
    throw new ErreurVanillaPay(PRESTATAIRE_INJOIGNABLE, "jeton");
  }
  const corps = await lire<{ Token?: string }>(reponse);
  const brut = corps.Data?.Token;
  if (Number(corps.CodeRetour) !== 200 || !brut) throw new ErreurVanillaPay(PRESTATAIRE_INJOIGNABLE, corps.DetailRetour ?? corps.DescRetour ?? `jeton refusé (${reponse.status})`);
  const valeur = /^bearer\s/i.test(brut) ? brut : `Bearer ${brut}`;
  jetonEnCache = { valeur, expire: Date.now() + 5 * 60_000 };
  return valeur;
}

export type OuverturePaiement = { montant: number; reference: string; notifUrl: string; redirectUrl: string; modePaiement: ModeVanillaPay };

/** Messages connus du prestataire, traduits pour le payeur (section 4.7). */
export function messagePourLePayeur(detail: string | null | undefined): string {
  const d = (detail ?? "").toLowerCase();
  if (d.includes("paiement international") || d.includes("mobile money")) return "Ce moyen de paiement n’est pas encore activé pour La Traversée. Choisissez-en un autre, ou écrivez à l’équipe.";
  if (d.includes("mvola") && d.includes("indisponible")) return "MVola est indisponible pour le moment. Réessayez dans quelques minutes ou choisissez un autre moyen.";
  if (d.includes("panier")) return "Référence de paiement trop longue : contactez l’équipe.";
  return PRESTATAIRE_INJOIGNABLE;
}

/** Ouvre un paiement et renvoie l'adresse où envoyer le payeur, avec l'identifiant de transaction lu dans cette adresse. */
export async function ouvrirPaiement(o: OuverturePaiement): Promise<{ url: string; transaction: string | null }> {
  const c = config();
  const corpsEnvoye = { montant: Math.round(o.montant), reference: o.reference, panier: o.reference.slice(0, 20), notif_url: o.notifUrl, redirect_url: o.redirectUrl, devise: "MGA", mode_paiement: o.modePaiement };
  let reponse: Response;
  try {
    reponse = await fetch(`${c.base}/api/webpayment/v2/initiate`, { method: "POST", headers: { Authorization: await jeton(), "VPI-Version": c.version, "Content-Type": "application/json", Accept: "*/*" }, body: JSON.stringify(corpsEnvoye), cache: "no-store", signal: AbortSignal.timeout(20_000) });
  } catch (e) {
    if (e instanceof ErreurVanillaPay) throw e;
    throw new ErreurVanillaPay(PRESTATAIRE_INJOIGNABLE, "ouverture");
  }
  const corps = await lire<{ url?: string }>(reponse);
  const url = corps.Data?.url;
  if (Number(corps.CodeRetour) !== 200 || !url) throw new ErreurVanillaPay(messagePourLePayeur(corps.DetailRetour ?? corps.DescRetour), corps.DetailRetour ?? corps.DescRetour ?? `ouverture refusée (${reponse.status})`);
  return { url, transaction: transactionDepuisUrl(url) };
}

/** L'adresse de paiement porte un paramètre id = xxx.yyy.zzz ; le segment du milieu, en base64url, est l'identifiant de transaction. */
export function transactionDepuisUrl(url: string): string | null {
  try {
    const id = new URL(url).searchParams.get("id");
    const milieu = id?.split(".")[1];
    if (!milieu) return null;
    const texte = Buffer.from(milieu, "base64url").toString("utf8").trim();
    return /^[\w.-]{3,120}$/.test(texte) ? texte : null;
  } catch {
    return null;
  }
}

/**
 * Lien direct vers l'opérateur de mobile money (page interne de Vanilla Pay, non documentée), seulement sur une adresse
 * du prestataire (vanilla-pay.net) ; ailleurs (simulateur local), l'adresse normale.
 */
export function lienOperateur(url: string, operateur: Operateur): string {
  try {
    const u = new URL(url);
    const id = u.searchParams.get("id");
    if (!id || !/(^|\.)vanilla-pay\.net$/i.test(u.hostname)) return url;
    return `${u.origin}/api/mobileMoney/selectChoice/addNumero?${new URLSearchParams({ id, type: operateur, lang: "Français" })}`;
  } catch {
    return url;
  }
}

export type EtatTransaction = "reussi" | "echoue" | "en_cours";

/** « SUCCESS » et ses variantes = réussi, « FAILED » et ses variantes = échoué, le reste = en cours. */
export function etatNormalise(etat: unknown): EtatTransaction {
  const e = String(etat ?? "").trim().toLowerCase();
  if (["success", "succes", "succès", "paid", "payé", "completed", "complete", "ok", "validated", "reussi", "réussi"].includes(e)) return "reussi";
  if (["failed", "fail", "failure", "refused", "rejected", "declined", "canceled", "cancelled", "expired", "error", "echoue", "échoué", "ko"].includes(e)) return "echoue";
  return "en_cours";
}

export type Notification = {
  reference: string | null;
  referenceVPI: string | null;
  etat: EtatTransaction;
  etatBrut: string | null;
  /** Montant en ariary tel que le prestataire l'annonce (montant_mga pour la carte, montant pour le mobile money). */
  montantAriary: number | null;
  initiateur: string | null;
  referenceMM: string | null;
  donnees: Record<string, unknown>;
};

function champ(d: Record<string, unknown>, ...noms: string[]): string | null {
  for (const n of noms) {
    const v = d[n];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return null;
}

/** Lit une notification (JSON ou formulaire encodé), dont les champs peuvent être sous « Data ». */
export function lireNotification(corpsBrut: string, contentType: string | null = null): Notification {
  let brut: Record<string, unknown> = {};
  const texte = corpsBrut.trim();
  if (texte.startsWith("{") || texte.startsWith("[")) {
    try {
      brut = JSON.parse(texte) as Record<string, unknown>;
    } catch {
      brut = {};
    }
  } else if (texte && (contentType?.includes("form-urlencoded") || texte.includes("="))) {
    brut = Object.fromEntries(new URLSearchParams(texte));
  }
  const data = brut.Data && typeof brut.Data === "object" ? (brut.Data as Record<string, unknown>) : null;
  const d = { ...brut, ...(data ?? {}) };
  const carte = champ(d, "montant_mga", "montantMga", "montant_MGA");
  const montant = champ(d, "montant", "amount");
  const montantAriary = carte ?? montant;
  return {
    reference: champ(d, "reference", "panier"),
    referenceVPI: champ(d, "reference_VPI", "reference_vpi", "referenceVPI"),
    etat: etatNormalise(champ(d, "etat", "status", "state")),
    etatBrut: champ(d, "etat", "status", "state"),
    montantAriary: montantAriary && Number.isFinite(Number(montantAriary)) ? Math.round(Number(montantAriary)) : null,
    initiateur: champ(d, "initiateur"),
    referenceMM: champ(d, "referenceMM", "reference_mm"),
    donnees: d,
  };
}

/** Signature HMAC-SHA256 du corps brut avec la clé secrète, en hexadécimal majuscule. */
export function signer(corpsBrut: string, keySecret = config().keySecret): string {
  return createHmac("sha256", keySecret).update(corpsBrut, "utf8").digest("hex").toUpperCase();
}

/** Vraie seulement si la signature reçue correspond, comparée en temps constant. */
export function signatureValide(corpsBrut: string, signature: string | null | undefined, keySecret = config().keySecret): boolean {
  if (!signature || !keySecret) return false;
  const attendue = Buffer.from(signer(corpsBrut, keySecret), "utf8");
  const recue = Buffer.from(signature.trim().toUpperCase(), "utf8");
  return attendue.length === recue.length && timingSafeEqual(attendue, recue);
}

/** État d'une transaction chez Vanilla Pay (au retour du payeur, quand la notification n'est pas encore arrivée). */
export async function etatTransaction(transaction: string, modePaiement: ModeVanillaPay): Promise<Notification> {
  const c = config();
  let reponse: Response;
  try {
    reponse = await fetch(`${c.base}/api/webpayment/v2/status/${encodeURIComponent(transaction)}?mode_paiement=${modePaiement}`, { headers: { Authorization: await jeton(), "VPI-Version": c.version, Accept: "*/*" }, cache: "no-store", signal: AbortSignal.timeout(15_000) });
  } catch (e) {
    if (e instanceof ErreurVanillaPay) throw e;
    throw new ErreurVanillaPay(PRESTATAIRE_INJOIGNABLE, "état");
  }
  const texte = await reponse.text();
  if (!reponse.ok) throw new ErreurVanillaPay(PRESTATAIRE_INJOIGNABLE, `état ${reponse.status}`);
  return lireNotification(texte, "application/json");
}
