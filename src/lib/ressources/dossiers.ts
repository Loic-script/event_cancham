export type DossierLite = { id: string; parentId: string | null };

export const PROFONDEUR_MAX = 5;

export function indexer<T extends DossierLite>(dossiers: readonly T[]): Map<string, T> {
  return new Map(dossiers.map((d) => [d.id, d]));
}

export function chaineDossiers<T extends DossierLite>(dossiers: ReadonlyMap<string, T>, id: string | null): T[] {
  const chaine: T[] = [];
  const vus = new Set<string>();
  let courant = id ? dossiers.get(id) : undefined;
  while (courant && !vus.has(courant.id)) {
    vus.add(courant.id);
    chaine.push(courant);
    courant = courant.parentId ? dossiers.get(courant.parentId) : undefined;
  }
  return chaine;
}

export function profondeur(dossiers: ReadonlyMap<string, DossierLite>, id: string | null): number {
  return chaineDossiers(dossiers, id).length;
}

export function descendants(dossiers: ReadonlyMap<string, DossierLite>, id: string): Set<string> {
  const enfants = new Map<string, string[]>();
  for (const d of dossiers.values()) {
    if (!d.parentId) continue;
    const liste = enfants.get(d.parentId) ?? [];
    liste.push(d.id);
    enfants.set(d.parentId, liste);
  }
  const resultat = new Set<string>();
  const pile = [...(enfants.get(id) ?? [])];
  while (pile.length) {
    const courant = pile.pop()!;
    if (resultat.has(courant) || courant === id) continue;
    resultat.add(courant);
    pile.push(...(enfants.get(courant) ?? []));
  }
  return resultat;
}

export function hauteur(dossiers: ReadonlyMap<string, DossierLite>, id: string): number {
  let max = 0;
  for (const d of descendants(dossiers, id)) {
    let niveau = 0;
    let courant: DossierLite | undefined = dossiers.get(d);
    while (courant && courant.id !== id) {
      niveau += 1;
      courant = courant.parentId ? dossiers.get(courant.parentId) : undefined;
    }
    max = Math.max(max, niveau);
  }
  return max + 1;
}

export type VerdictDeplacement = { ok: true } | { ok: false; raison: string };

export function verifierDeplacement(dossiers: ReadonlyMap<string, DossierLite>, id: string, nouveauParentId: string | null): VerdictDeplacement {
  if (!dossiers.has(id)) return { ok: false, raison: "Dossier introuvable." };
  if (nouveauParentId === null) {
    return hauteur(dossiers, id) <= PROFONDEUR_MAX ? { ok: true } : { ok: false, raison: `L’arborescence dépasserait ${PROFONDEUR_MAX} niveaux.` };
  }
  if (!dossiers.has(nouveauParentId)) return { ok: false, raison: "Dossier de destination introuvable." };
  if (nouveauParentId === id || descendants(dossiers, id).has(nouveauParentId)) {
    return { ok: false, raison: "Un dossier ne peut pas être rangé dans lui-même ni dans un de ses sous-dossiers." };
  }
  if (profondeur(dossiers, nouveauParentId) + hauteur(dossiers, id) > PROFONDEUR_MAX) {
    return { ok: false, raison: `L’arborescence dépasserait ${PROFONDEUR_MAX} niveaux.` };
  }
  return { ok: true };
}

export function verifierCreation(dossiers: ReadonlyMap<string, DossierLite>, parentId: string | null): VerdictDeplacement {
  if (parentId === null) return { ok: true };
  if (!dossiers.has(parentId)) return { ok: false, raison: "Dossier parent introuvable." };
  return profondeur(dossiers, parentId) + 1 <= PROFONDEUR_MAX ? { ok: true } : { ok: false, raison: `${PROFONDEUR_MAX} niveaux de dossiers au maximum.` };
}
