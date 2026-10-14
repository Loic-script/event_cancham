"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { arbreDossiers, dupliquerDossier, dupliquerRessource, journaliser, prochainOrdre, prochainOrdreDossier, validerMeta } from "@/lib/ressources/admin";
import { dureeLecture, fichiersUtilises, nettoyerBlocs, premierePhoto } from "@/lib/ressources/blocs";
import { verifierCreation, verifierDeplacement } from "@/lib/ressources/dossiers";
import { dossierBlocs, dossierImages, dossierRessource, existe, fichierBloc, idValide, listerBlocs, supprimer } from "@/lib/ressources/stockage";
import { genererCouverture } from "@/lib/ressources/traitement";
import path from "node:path";

export type Resultat = { ok: true; id?: string; message?: string } | { ok: false; message: string };

function rafraichir() {
  revalidatePath("/ressources", "layout");
  revalidatePath("/admin/ressources", "layout");
}

type DonneesDossier = { nom?: unknown; parentId?: unknown; auteurNom?: unknown; auteurRole?: unknown; auteurBio?: unknown };

function texte(v: unknown, max: number): string | null {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
}

function parentDe(v: unknown): string | null | "invalide" {
  if (v === null || v === undefined || v === "") return null;
  return typeof v === "string" && idValide(v) ? v : "invalide";
}

export async function creerDossier(d: DonneesDossier): Promise<Resultat> {
  const nom = texte(d.nom, 120);
  if (!nom) return { ok: false, message: "Le nom du dossier est obligatoire." };
  const parentId = parentDe(d.parentId);
  if (parentId === "invalide") return { ok: false, message: "Dossier parent introuvable." };
  const { index } = await arbreDossiers();
  const v = verifierCreation(index, parentId);
  if (!v.ok) return { ok: false, message: v.raison };
  const cree = await prisma.dossier.create({
    data: { nom, parentId, ordre: await prochainOrdreDossier(parentId), auteurNom: texte(d.auteurNom, 120), auteurRole: texte(d.auteurRole, 160), auteurBio: texte(d.auteurBio, 600) },
    select: { id: true },
  });
  await journaliser("dossier_cree", nom);
  rafraichir();
  return { ok: true, id: cree.id };
}

export async function modifierDossier(id: string, d: DonneesDossier): Promise<Resultat> {
  if (!idValide(id)) return { ok: false, message: "Dossier introuvable." };
  const actuel = await prisma.dossier.findUnique({ where: { id }, select: { parentId: true } });
  if (!actuel) return { ok: false, message: "Dossier introuvable." };
  const nom = texte(d.nom, 120);
  if (!nom) return { ok: false, message: "Le nom du dossier est obligatoire." };
  const parentId = parentDe(d.parentId);
  if (parentId === "invalide") return { ok: false, message: "Dossier de destination introuvable." };
  let ordre: number | undefined;
  if (parentId !== actuel.parentId) {
    const { index } = await arbreDossiers();
    const v = verifierDeplacement(index, id, parentId);
    if (!v.ok) return { ok: false, message: v.raison };
    ordre = await prochainOrdreDossier(parentId);
  }
  await prisma.dossier.update({ where: { id }, data: { nom, parentId, ...(ordre ? { ordre } : {}), auteurNom: texte(d.auteurNom, 120), auteurRole: texte(d.auteurRole, 160), auteurBio: texte(d.auteurBio, 600) } });
  await journaliser("dossier_modifie", nom);
  rafraichir();
  return { ok: true, id };
}

export async function supprimerDossier(id: string): Promise<Resultat> {
  if (!idValide(id)) return { ok: false, message: "Dossier introuvable." };
  const d = await prisma.dossier.findUnique({ where: { id }, select: { nom: true, parentId: true } });
  if (!d) return { ok: false, message: "Dossier introuvable." };
  await prisma.$transaction(async (tx) => {
    const baseD = (await tx.dossier.aggregate({ where: { parentId: d.parentId }, _max: { ordre: true } }))._max.ordre ?? 0;
    const enfants = await tx.dossier.findMany({ where: { parentId: id }, orderBy: { ordre: "asc" }, select: { id: true } });
    for (const [i, e] of enfants.entries()) await tx.dossier.update({ where: { id: e.id }, data: { parentId: d.parentId, ordre: baseD + i + 1 } });
    const baseR = (await tx.ressource.aggregate({ where: { dossierId: d.parentId }, _max: { ordre: true } }))._max.ordre ?? 0;
    const ressources = await tx.ressource.findMany({ where: { dossierId: id }, orderBy: { ordre: "asc" }, select: { id: true } });
    for (const [i, r] of ressources.entries()) await tx.ressource.update({ where: { id: r.id }, data: { dossierId: d.parentId, ordre: baseR + i + 1 } });
    await tx.dossier.delete({ where: { id } });
  });
  await supprimer(dossierImages(id));
  await journaliser("dossier_supprime", d.nom);
  rafraichir();
  return { ok: true, id: d.parentId ?? undefined };
}

export async function creerPage(meta: unknown): Promise<Resultat> {
  const m = await validerMeta(meta);
  if (!m.ok) return { ok: false, message: m.message };
  const r = await prisma.ressource.create({ data: { ...m.valeur, format: "page", contenu: [], taille: "1 min de lecture", ordre: await prochainOrdre(m.valeur.dossierId) }, select: { id: true } });
  await journaliser("page_creee", m.valeur.titre);
  rafraichir();
  return { ok: true, id: r.id };
}

export async function modifierRessource(id: string, meta: unknown): Promise<Resultat> {
  if (!idValide(id)) return { ok: false, message: "Ressource introuvable." };
  const actuel = await prisma.ressource.findUnique({ where: { id }, select: { dossierId: true } });
  if (!actuel) return { ok: false, message: "Ressource introuvable." };
  const m = await validerMeta(meta);
  if (!m.ok) return { ok: false, message: m.message };
  const ordre = m.valeur.dossierId !== actuel.dossierId ? await prochainOrdre(m.valeur.dossierId) : undefined;
  await prisma.ressource.update({ where: { id }, data: { ...m.valeur, ...(ordre ? { ordre } : {}) } });
  await journaliser("ressource_modifiee", m.valeur.titre);
  rafraichir();
  return { ok: true, id };
}

export async function supprimerRessources(ids: string[]): Promise<Resultat> {
  const valides = ids.filter(idValide);
  if (!valides.length) return { ok: false, message: "Aucune ressource sélectionnée." };
  const liste = await prisma.ressource.findMany({ where: { id: { in: valides } }, select: { id: true, titre: true } });
  await prisma.ressource.deleteMany({ where: { id: { in: liste.map((r) => r.id) } } });
  for (const r of liste) await supprimer(dossierRessource(r.id));
  await journaliser("ressources_supprimees", liste.map((r) => r.titre).join(" · "));
  rafraichir();
  return { ok: true, message: `${liste.length} ressource${liste.length > 1 ? "s" : ""} supprimée${liste.length > 1 ? "s" : ""}.` };
}

export async function reordonner(dossierId: string | null, ids: string[]): Promise<Resultat> {
  if (dossierId !== null && !idValide(dossierId)) return { ok: false, message: "Dossier introuvable." };
  const valides = ids.filter(idValide);
  const presentes = await prisma.ressource.findMany({ where: { id: { in: valides }, dossierId }, select: { id: true } });
  const ok = new Set(presentes.map((r) => r.id));
  await prisma.$transaction(valides.filter((id) => ok.has(id)).map((id, i) => prisma.ressource.update({ where: { id }, data: { ordre: i + 1 } })));
  rafraichir();
  return { ok: true };
}

export async function coller(presse: { mode: "couper" | "copier"; ressources: string[]; dossiers: string[] }, destination: string | null): Promise<Resultat> {
  if (destination !== null && (!idValide(destination) || !(await prisma.dossier.findUnique({ where: { id: destination }, select: { id: true } })))) {
    return { ok: false, message: "Dossier de destination introuvable." };
  }
  const ressources = presse.ressources.filter(idValide);
  const dossiers = presse.dossiers.filter(idValide);
  const erreurs: string[] = [];
  let faits = 0;
  if (presse.mode === "couper") {
    let ordre = await prochainOrdre(destination);
    for (const id of ressources) {
      const r = await prisma.ressource.updateMany({ where: { id }, data: { dossierId: destination, ordre: ordre++ } });
      faits += r.count;
    }
    for (const id of dossiers) {
      const { index } = await arbreDossiers();
      const v = verifierDeplacement(index, id, destination);
      if (!v.ok) {
        erreurs.push(v.raison);
        continue;
      }
      await prisma.dossier.update({ where: { id }, data: { parentId: destination, ordre: await prochainOrdreDossier(destination) } });
      faits += 1;
    }
  } else {
    let ordre = await prochainOrdre(destination);
    for (const id of ressources) {
      try {
        await dupliquerRessource(id, destination, ordre++);
        faits += 1;
      } catch {
        erreurs.push("Une ressource n’a pas pu être copiée.");
      }
    }
    for (const id of dossiers) {
      const { index } = await arbreDossiers();
      const v = verifierDeplacement(index, id, destination);
      if (!v.ok) {
        erreurs.push(v.raison);
        continue;
      }
      await dupliquerDossier(id, destination, await prochainOrdreDossier(destination));
      faits += 1;
    }
  }
  await journaliser(presse.mode === "couper" ? "elements_deplaces" : "elements_copies", `${faits} élément(s)`);
  rafraichir();
  if (!faits && erreurs.length) return { ok: false, message: erreurs[0] };
  return { ok: true, message: `${faits} élément${faits > 1 ? "s" : ""} ${presse.mode === "couper" ? "déplacé" : "copié"}${faits > 1 ? "s" : ""}.${erreurs.length ? ` ${erreurs[0]}` : ""}` };
}

export async function enregistrerContenu(id: string, brut: unknown): Promise<Resultat> {
  if (!idValide(id)) return { ok: false, message: "Ressource introuvable." };
  const r = await prisma.ressource.findUnique({ where: { id }, select: { format: true, couverturePerso: true, couverture: true } });
  if (!r || r.format !== "page") return { ok: false, message: "Page introuvable." };
  const blocs = nettoyerBlocs(brut);
  const utilises = fichiersUtilises(blocs);
  const presents = await listerBlocs(id);
  for (const nom of presents) if (!utilises.has(nom)) await supprimer(fichierBloc(id, nom));
  const nettoyes = blocs.map((b) => ((b.type === "photo" || b.type === "video") && b.fichier && !presents.includes(b.fichier) ? { ...b, fichier: null } : b));
  let couverture = r.couverture;
  if (!r.couverturePerso) {
    const photo = premierePhoto(nettoyes);
    couverture = null;
    if (photo && (await existe(path.join(dossierBlocs(id), photo)))) {
      await genererCouverture(path.join(dossierBlocs(id), photo), path.join(dossierRessource(id), "couverture.jpg"));
      couverture = "couverture.jpg";
    } else {
      await supprimer(path.join(dossierRessource(id), "couverture.jpg"));
    }
  }
  await prisma.ressource.update({ where: { id }, data: { contenu: nettoyes as unknown as object, taille: dureeLecture(nettoyes), couverture } });
  await journaliser("page_enregistree", id);
  rafraichir();
  return { ok: true, id };
}
