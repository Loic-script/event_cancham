import { notifier, SIMULATEUR_ACTIF, transactionDepuisId } from "@/lib/simulateur-vanillapay";

export const dynamic = "force-dynamic";

/**
 * Simulateur : le payeur a cliqué « Paiement réussi » ou « Paiement échoué » (ou « montant différent », pour les tests).
 * Marque la transaction, envoie la notification signée à notif_url (sauf `sans_notification`), puis renvoie le payeur à redirect_url.
 */
export async function POST(request: Request) {
  if (!SIMULATEUR_ACTIF) return new Response(null, { status: 404 });
  const f = await request.formData();
  const t = transactionDepuisId(String(f.get("id") ?? ""));
  if (!t) return new Response("Transaction inconnue", { status: 404 });
  const issue = String(f.get("issue") ?? "");
  t.etat = issue === "echec" ? "FAILED" : "SUCCESS";
  if (!f.get("sans_notification")) await notifier(t, issue === "montant" ? Math.max(5000, Math.round(t.montant / 2)) : undefined);
  return Response.redirect(t.redirectUrl, 303);
}
