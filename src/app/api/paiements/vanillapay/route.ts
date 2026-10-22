import { after } from "next/server";
import { conclurePaiement, prevenirPaiementReussi } from "@/lib/paiements";
import { prisma } from "@/lib/prisma";
import { lireNotification, signatureValide } from "@/lib/vanillapay";

export const dynamic = "force-dynamic";

/**
 * Notification de Vanilla Pay (notif_url). Le corps est lu brut pour vérifier la signature HMAC-SHA256 (VPI-Signature)
 * avant toute lecture ; sans signature valable, rien n'est fait. Réponse 200 dès que c'est traité.
 */
export async function POST(request: Request) {
  const corps = await request.text();
  if (!signatureValide(corps, request.headers.get("vpi-signature"))) return Response.json({ ok: false, message: "Signature absente ou invalide." }, { status: 401 });

  const n = lireNotification(corps, request.headers.get("content-type"));
  if (!n.reference) return Response.json({ ok: false, message: "Référence absente." }, { status: 400 });
  const paiement = await prisma.paiement.findUnique({ where: { reference: n.reference }, select: { transaction: true } });
  if (!paiement) return Response.json({ ok: false, message: "Référence inconnue." }, { status: 404 });

  const resultat = await conclurePaiement(n.reference, { etat: n.etat, transaction: n.referenceVPI ?? n.referenceMM ?? paiement.transaction, notification: n.donnees, montantAriary: n.montantAriary });
  if (resultat === "reussi") {
    const reference = n.reference;
    after(() => prevenirPaiementReussi(reference));
  }
  return Response.json({ ok: true, resultat });
}
