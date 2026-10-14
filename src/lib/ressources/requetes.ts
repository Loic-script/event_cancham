import { prisma } from "@/lib/prisma";
import { chaineDossiers } from "./acces";
import { nettoyerBlocs } from "./blocs";
import type { Contexte, DossierComplet } from "./contexte";
import { existe, fichierPage, fichierRessource } from "./stockage";
import type { Categorie, Format, TypeAcces } from "./types";

export type Filtre = "tout" | "gratuites" | "payantes";
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
  type: TypeAcces;
  prix: number;
  couverture: boolean;
  dossierId: string | null;
  ordre: number;
  lue: boolean;
  ouverte: boolean;
  fichierManquant: boolean;
  nbAcces: number;
};

export type CarteDossier = {
  id: string;
  nom: string;
  couverture: boolean;
  restreint: boolean;
  nbRessources: number;
  nbVideos: number;
  nbSousDossiers: number;
  nbAcces: number;
  parentId: string | null;
};

export type Section = { dossier: CarteDossier; ressources: CarteRessource[] };

export type Bibliotheque = {
  fil: { id: string; nom: string }[];
  dossier: (DossierComplet & { restreintHerite: boolean }) | null;
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

async function contenuManquant(r: { id: string; format: Format; pages: number; fichier: string | null; contenu: unknown }): Promise<boolean> {
  if (r.format === "page") return nettoyerBlocs(r.contenu).length === 0;
  if (r.format === "video") return !r.fichier || !(await existe(fichierRessource(r.id, r.fichier)));
  return r.pages < 1 || !(await existe(fichierPage(r.id, 1)));
}

export async function chargerRessources(ctx: Contexte) {
  const [liste, lectures] = await Promise.all([
    prisma.ressource.findMany({
      select: { id: true, titre: true, description: true, categorie: true, format: true, taille: true, date: true, type: true, prix: true, couverture: true, dossierId: true, ordre: true, pages: true, fichier: true, contenu: ctx.equipe, _count: { select: { acces: true } } },
      orderBy: [{ ordre: "asc" }, { date: "desc" }],
    }),
    ctx.session ? prisma.lectureRessource.findMany({ where: { utilisateurId: ctx.session.id }, select: { ressourceId: true } }) : Promise.resolve([]),
  ]);
  const lues = new Set(lectures.map((l) => l.ressourceId));
  const visibles = liste.filter((r) => ctx.visibilite(r) === "ok");
  return Promise.all(
    visibles.map(
      async (r): Promise<CarteRessource> => ({
        id: r.id,
        titre: r.titre,
        description: r.description,
        categorie: r.categorie,
        format: r.format,
        taille: r.taille,
        date: r.date,
        type: r.type,
        prix: r.prix,
        couverture: Boolean(r.couverture),
        dossierId: r.dossierId,
        ordre: r.ordre,
        lue: lues.has(r.id),
        ouverte: ctx.lecture(r) === "ok",
        fichierManquant: ctx.equipe ? await contenuManquant({ ...r, contenu: "contenu" in r ? r.contenu : null }) : false,
        nbAcces: r._count.acces,
      }),
    ),
  );
}

function sousArbre(ctx: Contexte, id: string): Set<string> {
  const s = new Set<string>([id]);
  for (const d of ctx.dossiers.values()) {
    if (chaineDossiers(ctx.dossiers, d.id).some((x) => x.id === id)) s.add(d.id);
  }
  return s;
}

function carteDossier(ctx: Contexte, d: DossierComplet, toutes: CarteRessource[]): CarteDossier {
  const arbre = sousArbre(ctx, d.id);
  const dedans = toutes.filter((r) => r.dossierId && arbre.has(r.dossierId));
  return {
    id: d.id,
    nom: d.nom,
    couverture: Boolean(d.couverture),
    restreint: d.restreint,
    nbRessources: dedans.length,
    nbVideos: dedans.filter((r) => r.format === "video").length,
    nbSousDossiers: [...ctx.dossiers.values()].filter((x) => x.parentId === d.id && ctx.visible(x.id)).length,
    nbAcces: d.nbAcces,
    parentId: d.parentId,
  };
}

function trier<T extends { titre?: string; nom?: string; date?: Date; ordre: number; updatedAt?: Date }>(liste: T[], tri: Tri): T[] {
  const copie = [...liste];
  if (tri === "nom") return copie.sort((a, b) => (a.titre ?? a.nom ?? "").localeCompare(b.titre ?? b.nom ?? "", "fr", { sensitivity: "base" }));
  if (tri === "date") return copie.sort((a, b) => (b.date ?? b.updatedAt ?? new Date(0)).getTime() - (a.date ?? a.updatedAt ?? new Date(0)).getTime());
  return copie.sort((a, b) => a.ordre - b.ordre);
}

export async function listerBibliotheque(ctx: Contexte, options: { dossierId: string | null; q: string; filtre: Filtre; tri: Tri }): Promise<Bibliotheque | null> {
  const { dossierId, filtre } = options;
  if (dossierId && (!ctx.dossiers.has(dossierId) || !ctx.visible(dossierId))) return null;
  const toutes = await chargerRessources(ctx);
  const q = normaliser(options.q.trim());
  const recherche = q.length > 0;
  const tri: Tri = options.tri === "ordre" && !dossierId && !recherche ? "date" : options.tri;
  const dossier = dossierId ? ctx.dossiers.get(dossierId)! : null;
  const fil = dossier ? chaineDossiers(ctx.dossiers, dossier.id).reverse().map((d) => ({ id: d.id, nom: (d as DossierComplet).nom })) : [];
  const dossiersVisibles = [...ctx.dossiers.values()].filter((d) => ctx.visible(d.id));

  let portee: CarteRessource[];
  let sousDossiers: DossierComplet[];
  if (recherche) {
    const arbre = dossier ? sousArbre(ctx, dossier.id) : null;
    portee = toutes.filter((r) => normaliser(r.titre).includes(q) && (!arbre || (r.dossierId !== null && arbre.has(r.dossierId))));
    sousDossiers = dossiersVisibles.filter((d) => normaliser(d.nom).includes(q) && (!arbre || (arbre.has(d.id) && d.id !== dossier?.id)));
  } else {
    portee = toutes.filter((r) => r.dossierId === (dossierId ?? null));
    sousDossiers = dossiersVisibles.filter((d) => d.parentId === (dossierId ?? null));
  }

  const compteurs: Record<Filtre, number> = {
    tout: portee.length,
    gratuites: portee.filter((r) => r.type === "gratuit").length,
    payantes: portee.filter((r) => r.type === "payant").length,
  };
  const filtrees = portee.filter((r) => filtre === "tout" || (filtre === "gratuites" ? r.type === "gratuit" : r.type === "payant"));
  const cartesDossiers = trier(sousDossiers, tri === "nom" ? "nom" : tri === "date" ? "date" : "ordre").map((d) => carteDossier(ctx, d, toutes));

  let sections: Section[] = [];
  let progression = { terminees: 0, total: 0, videos: 0 };
  if (dossier) {
    const arbre = sousArbre(ctx, dossier.id);
    const dedans = toutes.filter((r) => r.dossierId && arbre.has(r.dossierId));
    progression = { terminees: dedans.filter((r) => r.lue).length, total: dedans.length, videos: dedans.filter((r) => r.format === "video").length };
    if (!recherche) {
      sections = cartesDossiers.map((c) => ({
        dossier: c,
        ressources: trier(
          toutes.filter((r) => r.dossierId === c.id && (filtre === "tout" || (filtre === "gratuites" ? r.type === "gratuit" : r.type === "payant"))),
          "ordre",
        ),
      }));
    }
  }

  return {
    fil,
    dossier: dossier ? { ...dossier, restreintHerite: chaineDossiers(ctx.dossiers, dossier.id).some((d) => d.restreint) } : null,
    sousDossiers: cartesDossiers,
    ressources: trier(filtrees, tri),
    sections,
    compteurs,
    progression,
    recherche,
  };
}

export async function etapesDossier(ctx: Contexte, dossierId: string, toutes?: CarteRessource[]): Promise<CarteRessource[]> {
  const liste = toutes ?? (await chargerRessources(ctx));
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
    filtre: (filtre === "gratuites" || filtre === "payantes" ? filtre : "tout") as Filtre,
    tri: (tri === "date" || tri === "nom" ? tri : "ordre") as Tri,
    vue: (un("vue") === "liste" ? "liste" : "grille") as Vue,
  };
}
