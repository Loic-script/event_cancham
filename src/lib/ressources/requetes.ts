import { prisma } from "@/lib/prisma";
import { nettoyerBlocs } from "./blocs";
import type { Contexte, DossierComplet } from "./contexte";
import { chaineDossiers } from "./dossiers";
import { existe, fichierPage, fichierRessource } from "./stockage";
import { estCategorie, type Categorie, type Format } from "./types";

export type Filtre = "tout" | Categorie;
export type Tri = "ordre" | "date" | "nom";
export type Vue = "grille" | "liste";

export type CarteRessource = {
  id: string;
  titre: string;
  description: string | null;
  categorie: Categorie;
  format: Format;
  taille: string | null;
  date: Date;
  couverture: boolean;
  couverturePerso: boolean;
  dossierId: string | null;
  ordre: number;
  lue: boolean;
  fichierManquant: boolean;
};

export type CarteDossier = {
  id: string;
  nom: string;
  couverture: boolean;
  nbRessources: number;
  nbVideos: number;
  nbSousDossiers: number;
  parentId: string | null;
};

export type Section = { dossier: CarteDossier; ressources: CarteRessource[] };

export type Bibliotheque = {
  fil: { id: string; nom: string }[];
  dossier: DossierComplet | null;
  sousDossiers: CarteDossier[];
  ressources: CarteRessource[];
  sections: Section[];
  compteurs: Record<Filtre, number>;
  progression: { terminees: number; total: number; videos: number };
  recherche: boolean;
};

function normaliser(t: string): string {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export async function contenuManquant(r: { id: string; format: Format; pages: number; fichier: string | null; contenu: unknown }): Promise<boolean> {
  if (r.format === "page") return nettoyerBlocs(r.contenu).length === 0;
  if (r.format === "video") return !r.fichier || !(await existe(fichierRessource(r.id, r.fichier)));
  return r.pages < 1 || !(await existe(fichierPage(r.id, 1)));
}

export async function chargerRessources(ctx: Contexte, verifierFichiers = false): Promise<CarteRessource[]> {
  const [liste, lectures] = await Promise.all([
    prisma.ressource.findMany({
      select: { id: true, titre: true, description: true, categorie: true, format: true, taille: true, date: true, couverture: true, couverturePerso: true, dossierId: true, ordre: true, pages: true, fichier: true, contenu: verifierFichiers },
      orderBy: [{ ordre: "asc" }, { date: "desc" }],
    }),
    ctx.lecteur ? prisma.lectureRessource.findMany({ where: { lecteur: ctx.lecteur }, select: { ressourceId: true } }) : Promise.resolve([]),
  ]);
  const lues = new Set(lectures.map((l) => l.ressourceId));
  return Promise.all(
    liste.map(
      async (r): Promise<CarteRessource> => ({
        id: r.id,
        titre: r.titre,
        description: r.description,
        categorie: r.categorie,
        format: r.format,
        taille: r.taille,
        date: r.date,
        couverture: Boolean(r.couverture),
        couverturePerso: r.couverturePerso,
        dossierId: r.dossierId,
        ordre: r.ordre,
        lue: lues.has(r.id),
        fichierManquant: verifierFichiers ? await contenuManquant({ ...r, contenu: "contenu" in r ? r.contenu : null }) : false,
      }),
    ),
  );
}

export function sousArbre(dossiers: ReadonlyMap<string, DossierComplet>, id: string): Set<string> {
  const s = new Set<string>([id]);
  for (const d of dossiers.values()) {
    if (chaineDossiers(dossiers, d.id).some((x) => x.id === id)) s.add(d.id);
  }
  return s;
}

function carteDossier(ctx: Contexte, d: DossierComplet, toutes: CarteRessource[]): CarteDossier {
  const arbre = sousArbre(ctx.dossiers, d.id);
  const dedans = toutes.filter((r) => r.dossierId && arbre.has(r.dossierId));
  return {
    id: d.id,
    nom: d.nom,
    couverture: Boolean(d.couverture),
    nbRessources: dedans.length,
    nbVideos: dedans.filter((r) => r.format === "video").length,
    nbSousDossiers: [...ctx.dossiers.values()].filter((x) => x.parentId === d.id).length,
    parentId: d.parentId,
  };
}

function trier<T extends { titre?: string; nom?: string; date?: Date; ordre: number; updatedAt?: Date }>(liste: T[], tri: Tri): T[] {
  const copie = [...liste];
  if (tri === "nom") return copie.sort((a, b) => (a.titre ?? a.nom ?? "").localeCompare(b.titre ?? b.nom ?? "", "fr", { sensitivity: "base" }));
  if (tri === "date") return copie.sort((a, b) => (b.date ?? b.updatedAt ?? new Date(0)).getTime() - (a.date ?? a.updatedAt ?? new Date(0)).getTime());
  return copie.sort((a, b) => a.ordre - b.ordre);
}

const correspond = (r: CarteRessource, filtre: Filtre) => filtre === "tout" || r.categorie === filtre;

export async function listerBibliotheque(ctx: Contexte, options: { dossierId: string | null; q: string; filtre: Filtre; tri: Tri; verifierFichiers?: boolean }): Promise<Bibliotheque | null> {
  const { dossierId, filtre } = options;
  if (dossierId && !ctx.dossiers.has(dossierId)) return null;
  const toutes = await chargerRessources(ctx, options.verifierFichiers);
  const q = normaliser(options.q.trim());
  const recherche = q.length > 0;
  const tri: Tri = options.tri === "ordre" && !dossierId && !recherche ? "date" : options.tri;
  const dossier = dossierId ? ctx.dossiers.get(dossierId)! : null;
  const fil = dossier ? chaineDossiers(ctx.dossiers, dossier.id).reverse().map((d) => ({ id: d.id, nom: d.nom })) : [];
  const tousDossiers = [...ctx.dossiers.values()];

  let portee: CarteRessource[];
  let sousDossiers: DossierComplet[];
  if (recherche) {
    const arbre = dossier ? sousArbre(ctx.dossiers, dossier.id) : null;
    portee = toutes.filter((r) => normaliser(r.titre).includes(q) && (!arbre || (r.dossierId !== null && arbre.has(r.dossierId))));
    sousDossiers = tousDossiers.filter((d) => normaliser(d.nom).includes(q) && (!arbre || (arbre.has(d.id) && d.id !== dossier?.id)));
  } else {
    portee = toutes.filter((r) => r.dossierId === (dossierId ?? null));
    sousDossiers = tousDossiers.filter((d) => d.parentId === (dossierId ?? null));
  }

  const compteurs: Record<Filtre, number> = { tout: portee.length, guide: 0, modele: 0, formation: 0, rapport: 0 };
  for (const r of portee) compteurs[r.categorie] += 1;
  const cartesDossiers = trier(sousDossiers, tri === "nom" ? "nom" : "ordre").map((d) => carteDossier(ctx, d, toutes));

  let sections: Section[] = [];
  let progression = { terminees: 0, total: 0, videos: 0 };
  if (dossier) {
    const arbre = sousArbre(ctx.dossiers, dossier.id);
    const dedans = toutes.filter((r) => r.dossierId && arbre.has(r.dossierId));
    progression = { terminees: dedans.filter((r) => r.lue).length, total: dedans.length, videos: dedans.filter((r) => r.format === "video").length };
    if (!recherche) {
      sections = cartesDossiers.map((c) => ({ dossier: c, ressources: trier(toutes.filter((r) => r.dossierId === c.id && correspond(r, filtre)), "ordre") }));
    }
  }

  return {
    fil,
    dossier,
    sousDossiers: cartesDossiers,
    ressources: trier(portee.filter((r) => correspond(r, filtre)), tri),
    sections,
    compteurs,
    progression,
    recherche,
  };
}

export async function etapesDossier(ctx: Contexte, dossierId: string): Promise<CarteRessource[]> {
  const liste = await chargerRessources(ctx);
  return liste.filter((r) => r.dossierId === dossierId).sort((a, b) => a.ordre - b.ordre);
}

export function lireParametres(sp: Record<string, string | string[] | undefined>) {
  const un = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : sp[k]) ?? "";
  const filtre = un("filtre");
  const tri = un("tri");
  const dossier = un("dossier");
  return {
    dossierId: /^[a-z0-9]{8,40}$/i.test(dossier) ? dossier : null,
    q: un("q").slice(0, 120),
    filtre: (estCategorie(filtre) ? filtre : "tout") as Filtre,
    tri: (tri === "date" || tri === "nom" ? tri : "ordre") as Tri,
    vue: (un("vue") === "liste" ? "liste" : "grille") as Vue,
  };
}
