import { jetonValide, reponse, SIMULATEUR_ACTIF, transactions } from "@/lib/simulateur-vanillapay";

export const dynamic = "force-dynamic";

/** Simulateur : état d'une transaction (GET /api/webpayment/v2/status/{transaction}?mode_paiement=…). */
export async function GET(request: Request, ctx: RouteContext<"/simulateur-vanillapay/api/webpayment/v2/status/[transaction]">) {
  if (!SIMULATEUR_ACTIF) return new Response(null, { status: 404 });
  if (!jetonValide(request.headers)) return reponse(401, "Jeton invalide", null, 401);
  const { transaction } = await ctx.params;
  const t = transactions.get(transaction);
  if (!t) return reponse(404, "Transaction inconnue", null, 404);
  return reponse(200, "Succès", { reference_VPI: `VPI-${t.transaction}`, reference: t.reference, panier: t.panier, montant: t.montant, montant_mga: t.modePaiement === "international" ? t.montant : undefined, etat: t.etat, date: new Date(t.creeLe).toISOString() });
}
