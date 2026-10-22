import { randomBytes } from "node:crypto";
import { jetonValide, reponse, SIMULATEUR_ACTIF, transactions, urlDePaiement } from "@/lib/simulateur-vanillapay";

export const dynamic = "force-dynamic";

/** Simulateur : ouverture d'un paiement (POST /api/webpayment/v2/initiate). */
export async function POST(request: Request) {
  if (!SIMULATEUR_ACTIF) return new Response(null, { status: 404 });
  if (!jetonValide(request.headers)) return reponse(401, "Jeton invalide", null, 401);
  const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return reponse(400, "Corps illisible");
  const montant = Number(b.montant);
  if (!Number.isFinite(montant) || montant < 5000) return reponse(400, "Montant minimum 5 000 Ar");
  if (typeof b.panier !== "string" || b.panier.length > 20) return reponse(400, "Le panier ne doit pas dépasser 20 caractères");
  if (b.mode_paiement !== "international" && b.mode_paiement !== "mobile_money") return reponse(400, "mode_paiement invalide");
  const transaction = `SIM${randomBytes(6).toString("hex").toUpperCase()}`;
  transactions.set(transaction, { transaction, montant: Math.round(montant), reference: String(b.reference ?? b.panier), panier: b.panier, notifUrl: String(b.notif_url ?? ""), redirectUrl: String(b.redirect_url ?? ""), modePaiement: b.mode_paiement, etat: "INITIATED", creeLe: Date.now() });
  const base = new URL(request.url).origin + "/simulateur-vanillapay";
  return reponse(200, "Succès", { url: urlDePaiement(base, transaction) });
}
