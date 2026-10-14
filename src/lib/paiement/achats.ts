import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { lireEtatPrestataire, moyenValide } from "./prestataire";

export type ResultatConfirmation =
  | { etat: "confirmee"; ressourceId: string; titre: string }
  | { etat: "deja"; ressourceId: string; titre: string }
  | { etat: "echouee"; ressourceId: string; titre: string }
  | { etat: "en_attente"; ressourceId: string; titre: string }
  | { etat: "inconnue" };

export function nouvelleReference(): string {
  return `RES-${Date.now().toString(36).toUpperCase()}-${randomBytes(5).toString("hex").toUpperCase()}`;
}

export async function creerTentative(params: { utilisateurId: string; membreId: string; ressource: { id: string; titre: string; prix: number }; moyen: string }) {
  const moyen = moyenValide(params.moyen, params.ressource.prix);
  if (!moyen) throw new Error("Moyen de paiement indisponible.");
  return prisma.tentativePaiement.create({
    data: {
      reference: nouvelleReference(),
      objetType: "ressource",
      objetId: params.ressource.id,
      objetTitre: params.ressource.titre,
      utilisateurId: params.utilisateurId,
      membreId: params.membreId,
      montant: params.ressource.prix,
      moyen: moyen.id,
    },
    select: { reference: true },
  });
}

export async function confirmerTentative(reference: string, source: "notification" | "retour"): Promise<ResultatConfirmation> {
  const resultat = await prisma.$transaction(async (tx) => {
    const t = await tx.tentativePaiement.findUnique({ where: { reference } });
    if (!t || t.objetType !== "ressource") return { etat: "inconnue" as const };
    const maj = await tx.tentativePaiement.updateMany({ where: { id: t.id, statut: { not: "reussie" } }, data: { statut: "reussie", confirmeeLe: new Date() } });
    if (maj.count === 0) return { etat: "deja" as const, ressourceId: t.objetId, titre: t.objetTitre };
    await tx.facture.create({
      data: {
        numero: `FAC-${new Date().getFullYear()}-${t.reference.slice(-10)}`,
        libelle: `Ressource — ${t.objetTitre}`,
        montant: t.montant,
        statut: "reglee",
        membreId: t.membreId,
        utilisateurId: t.utilisateurId,
        tentativeId: t.id,
      },
    });
    await tx.accesRessource.upsert({
      where: { ressourceId_membreId: { ressourceId: t.objetId, membreId: t.membreId } },
      update: {},
      create: { ressourceId: t.objetId, membreId: t.membreId, ouvertPar: "Achat en ligne" },
    });
    await tx.journal.create({ data: { acteur: "Paiement en ligne", action: "achat_ressource", details: `${t.objetTitre} · ${t.montant} Ar · ${t.reference} · ${source}` } });
    return { etat: "confirmee" as const, ressourceId: t.objetId, titre: t.objetTitre, utilisateurId: t.utilisateurId };
  });
  if (resultat.etat === "confirmee") {
    await prisma.notification.createMany({
      data: [
        { utilisateurId: resultat.utilisateurId, titre: "Ressource ouverte", message: `« ${resultat.titre} » vous est ouverte. Bonne lecture !`, lien: `/ressources/${resultat.ressourceId}` },
        { pourEquipe: true, titre: "Achat d’une ressource", message: `« ${resultat.titre} » vient d’être achetée en ligne.`, lien: `/admin/ressources/${resultat.ressourceId}` },
      ],
    });
    return { etat: "confirmee", ressourceId: resultat.ressourceId, titre: resultat.titre };
  }
  return resultat;
}

export async function echouerTentative(reference: string): Promise<void> {
  await prisma.tentativePaiement.updateMany({ where: { reference, statut: "en_attente" }, data: { statut: "echouee" } });
}

export async function verifierAuRetour(reference: string): Promise<ResultatConfirmation> {
  const t = await prisma.tentativePaiement.findUnique({ where: { reference }, select: { statut: true, etatPrestataire: true, objetId: true, objetTitre: true } });
  if (!t) return { etat: "inconnue" };
  if (t.statut === "reussie") return { etat: "deja", ressourceId: t.objetId, titre: t.objetTitre };
  const etat = lireEtatPrestataire(t.etatPrestataire);
  if (etat === "reussie") return confirmerTentative(reference, "retour");
  if (etat === "echouee") {
    await echouerTentative(reference);
    return { etat: "echouee", ressourceId: t.objetId, titre: t.objetTitre };
  }
  return { etat: "en_attente", ressourceId: t.objetId, titre: t.objetTitre };
}
