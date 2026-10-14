import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { indexer } from "./dossiers";
import { estCategorie, type Categorie } from "./types";
import { copierSiExiste, dossierImages, dossierRessource, idValide } from "./stockage";

export const ACTEUR = "Équipe CanCham";

export type MetaRessource = {
  titre: string;
  categorie: Categorie;
  description: string | null;
  dossierId: string | null;
};

export type Verdict<T> = { ok: true; valeur: T } | { ok: false; message: string };

export async function validerMeta(brut: unknown): Promise<Verdict<MetaRessource>> {
  if (!brut || typeof brut !== "object") return { ok: false, message: "Informations manquantes." };
  const o = brut as Record<string, unknown>;
  const titre = typeof o.titre === "string" ? o.titre.trim().slice(0, 200) : "";
  if (!titre) return { ok: false, message: "Le titre est obligatoire." };
  const categorie = estCategorie(o.categorie) ? o.categorie : "guide";
  const description = typeof o.description === "string" && o.description.trim() ? o.description.trim().slice(0, 600) : null;
  let dossierId: string | null = null;
  if (typeof o.dossierId === "string" && o.dossierId) {
    if (!idValide(o.dossierId) || !(await prisma.dossier.findUnique({ where: { id: o.dossierId }, select: { id: true } }))) return { ok: false, message: "Dossier introuvable." };
    dossierId = o.dossierId;
  }
  return { ok: true, valeur: { titre, categorie, description, dossierId } };
}

export async function prochainOrdre(dossierId: string | null): Promise<number> {
  const max = await prisma.ressource.aggregate({ where: { dossierId }, _max: { ordre: true } });
  return (max._max.ordre ?? 0) + 1;
}

export async function prochainOrdreDossier(parentId: string | null): Promise<number> {
  const max = await prisma.dossier.aggregate({ where: { parentId }, _max: { ordre: true } });
  return (max._max.ordre ?? 0) + 1;
}

export async function arbreDossiers() {
  const liste = await prisma.dossier.findMany({ select: { id: true, parentId: true, nom: true, ordre: true }, orderBy: { ordre: "asc" } });
  return { liste, index: indexer(liste) };
}

export async function journaliser(action: string, details?: string) {
  await prisma.journal.create({ data: { acteur: ACTEUR, action, details } });
}

export async function dupliquerRessource(id: string, dossierId: string | null, ordre: number): Promise<string> {
  const r = await prisma.ressource.findUnique({ where: { id } });
  if (!r) throw new Error("Ressource introuvable");
  const copie = await prisma.ressource.create({
    data: {
      titre: r.dossierId === dossierId ? `${r.titre} (copie)` : r.titre,
      categorie: r.categorie,
      format: r.format,
      taille: r.taille,
      tailleOctets: r.tailleOctets,
      date: r.date,
      fichier: r.fichier,
      pages: r.pages,
      couverture: r.couverture,
      couverturePerso: r.couverturePerso,
      description: r.description,
      contenu: r.contenu ?? undefined,
      ordre,
      dossierId,
    },
  });
  try {
    await copierSiExiste(dossierRessource(r.id), dossierRessource(copie.id));
  } catch (e) {
    await prisma.ressource.delete({ where: { id: copie.id } });
    throw e;
  }
  return copie.id;
}

export async function dupliquerDossier(id: string, parentId: string | null, ordre: number): Promise<string> {
  const d = await prisma.dossier.findUnique({ where: { id } });
  if (!d) throw new Error("Dossier introuvable");
  const copie = await prisma.dossier.create({
    data: {
      nom: d.parentId === parentId ? `${d.nom} (copie)` : d.nom,
      couverture: d.couverture,
      auteurNom: d.auteurNom,
      auteurRole: d.auteurRole,
      auteurBio: d.auteurBio,
      auteurPhoto: d.auteurPhoto,
      parentId,
      ordre,
    },
  });
  await copierSiExiste(dossierImages(d.id), dossierImages(copie.id));
  const ressources = await prisma.ressource.findMany({ where: { dossierId: d.id }, orderBy: { ordre: "asc" }, select: { id: true, ordre: true } });
  for (const r of ressources) await dupliquerRessource(r.id, copie.id, r.ordre);
  const enfants = await prisma.dossier.findMany({ where: { parentId: d.id }, orderBy: { ordre: "asc" }, select: { id: true, ordre: true } });
  for (const e of enfants) await dupliquerDossier(e.id, copie.id, e.ordre);
  return copie.id;
}

export async function enregistrerImageDossier(dossierId: string, source: string, type: "couverture" | "auteur"): Promise<string> {
  const nom = `${type}-${randomUUID().slice(0, 8)}.jpg`;
  const dest = path.join(dossierImages(dossierId), nom);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  const base = sharp(source, { limitInputPixels: 268402689 }).rotate();
  if (type === "auteur") await base.resize(400, 400, { fit: "cover", position: "attention" }).jpeg({ quality: 82, mozjpeg: true }).toFile(dest);
  else await base.resize({ width: 1600, height: 900, fit: "cover" }).jpeg({ quality: 80, mozjpeg: true }).toFile(dest);
  return nom;
}
