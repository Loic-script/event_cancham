import { confirmerTentative, echouerTentative } from "@/lib/paiement/achats";
import { lireEtatPrestataire, notificationAuthentique } from "@/lib/paiement/prestataire";
import { prisma } from "@/lib/prisma";
import { json } from "@/lib/ressources/servir";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const corps = await req.text();
  if (corps.length > 4096 || !notificationAuthentique(corps, req.headers.get("x-signature"))) return json(401, { ok: false, erreur: "Signature invalide" });
  let reference = "";
  try {
    const donnees = JSON.parse(corps) as { reference?: unknown };
    reference = typeof donnees.reference === "string" ? donnees.reference : "";
  } catch {
    return json(400, { ok: false, erreur: "Corps invalide" });
  }
  const t = await prisma.tentativePaiement.findUnique({ where: { reference }, select: { etatPrestataire: true } });
  if (!t) return json(404, { ok: false, erreur: "Tentative inconnue" });
  const etat = lireEtatPrestataire(t.etatPrestataire);
  if (etat === "reussie") {
    const r = await confirmerTentative(reference, "notification");
    return json(200, { ok: true, etat: r.etat });
  }
  if (etat === "echouee") await echouerTentative(reference);
  return json(200, { ok: true, etat });
}
