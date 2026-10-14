"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sessionCourante } from "@/lib/auth/session";
import { paiementEnLigneActif, signerNotification } from "@/lib/paiement/prestataire";
import { prisma } from "@/lib/prisma";

async function notifier(reference: string) {
  const h = await headers();
  const hote = h.get("x-forwarded-host") ?? h.get("host");
  if (!hote) return;
  const protocole = h.get("x-forwarded-proto") ?? (hote.startsWith("localhost") || hote.startsWith("127.") ? "http" : "https");
  const corps = JSON.stringify({ reference });
  try {
    await fetch(`${protocole}://${hote}/api/paiements/notification`, { method: "POST", headers: { "Content-Type": "application/json", "x-signature": signerNotification(corps) }, body: corps, cache: "no-store" });
  } catch {
    return;
  }
}

export async function reglerSimulation(reference: string, issue: "paye" | "refuse"): Promise<void> {
  if (!paiementEnLigneActif()) redirect("/ressources");
  const session = await sessionCourante();
  const t = await prisma.tentativePaiement.findUnique({ where: { reference }, select: { utilisateurId: true, statut: true } });
  if (!session || !t || t.utilisateurId !== session.id) redirect("/ressources");
  if (t.statut === "en_attente") {
    await prisma.tentativePaiement.updateMany({ where: { reference, etatPrestataire: null }, data: { etatPrestataire: issue } });
    await notifier(reference);
  }
  redirect(`/ressources/paiement/retour?ref=${encodeURIComponent(reference)}`);
}
