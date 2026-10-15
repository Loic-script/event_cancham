export type ParamsBibli = { dossierId: string | null; q: string; filtre: string; tri: string; vue: string };

export function lienBibli(base: string, p: ParamsBibli, changes: Partial<ParamsBibli> = {}): string {
  const v = { ...p, ...changes };
  const sp = new URLSearchParams();
  if (v.dossierId) sp.set("dossier", v.dossierId);
  if (v.q) sp.set("q", v.q);
  if (v.filtre && v.filtre !== "tout") sp.set("filtre", v.filtre);
  if (v.tri && v.tri !== "ordre") sp.set("tri", v.tri);
  if (v.vue && v.vue !== "grille") sp.set("vue", v.vue);
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

export const couvertureRessource = (id: string) => `/api/ressources/${id}/couverture`;
export const imageDossier = (id: string, type: "couverture" | "auteur") => `/api/dossiers/${id}/image/${type}`;
