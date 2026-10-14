export type Profil = { equipe: boolean; membreId: string | null; aJour: boolean } | null;

export type DossierLite = { id: string; parentId: string | null; restreint: boolean };

export type RessourceLite = { id: string; dossierId: string | null; type: "gratuit" | "payant" };

export type Decision = "ok" | "interdit" | "introuvable" | "payant";

export const MESSAGE_INTERDIT = "Accès réservé aux membres à jour de cotisation";
export const MESSAGE_INTROUVABLE = "Ressource introuvable";
export const MESSAGE_PAYANT = "Ressource payante : l’accès n’est pas ouvert pour votre entreprise";

export function membreAJour(cotisationJusquAu: Date | null | undefined, maintenant: Date = new Date()): boolean {
  return Boolean(cotisationJusquAu && cotisationJusquAu.getTime() >= maintenant.getTime());
}

export function peutAccederBibliotheque(profil: Profil): boolean {
  if (!profil) return false;
  if (profil.equipe) return true;
  return Boolean(profil.membreId && profil.aJour);
}

export function chaineDossiers(dossiers: ReadonlyMap<string, DossierLite>, id: string | null): DossierLite[] {
  const chaine: DossierLite[] = [];
  const vus = new Set<string>();
  let courant = id ? dossiers.get(id) : undefined;
  while (courant && !vus.has(courant.id)) {
    vus.add(courant.id);
    chaine.push(courant);
    courant = courant.parentId ? dossiers.get(courant.parentId) : undefined;
  }
  return chaine;
}

export function dossierAccessible(dossiers: ReadonlyMap<string, DossierLite>, id: string | null, accesDossiers: ReadonlySet<string>, equipe: boolean): boolean {
  if (equipe || !id) return true;
  if (!dossiers.has(id)) return false;
  return chaineDossiers(dossiers, id).every((d) => !d.restreint || accesDossiers.has(d.id));
}

export function decisionVisibilite(profil: Profil, ressource: RessourceLite, dossiers: ReadonlyMap<string, DossierLite>, accesDossiers: ReadonlySet<string>): Decision {
  if (!peutAccederBibliotheque(profil)) return "interdit";
  if (!dossierAccessible(dossiers, ressource.dossierId, accesDossiers, Boolean(profil?.equipe))) return "introuvable";
  return "ok";
}

export function decisionLecture(
  profil: Profil,
  ressource: RessourceLite,
  dossiers: ReadonlyMap<string, DossierLite>,
  accesDossiers: ReadonlySet<string>,
  accesRessources: ReadonlySet<string>,
): Decision {
  const visibilite = decisionVisibilite(profil, ressource, dossiers, accesDossiers);
  if (visibilite !== "ok") return visibilite;
  if (profil?.equipe || ressource.type === "gratuit" || accesRessources.has(ressource.id)) return "ok";
  return "payant";
}

export function statutHttp(decision: Decision): 200 | 403 | 404 {
  if (decision === "ok") return 200;
  if (decision === "introuvable") return 404;
  return 403;
}

export function messageDecision(decision: Decision): string {
  if (decision === "introuvable") return MESSAGE_INTROUVABLE;
  if (decision === "payant") return MESSAGE_PAYANT;
  return MESSAGE_INTERDIT;
}
