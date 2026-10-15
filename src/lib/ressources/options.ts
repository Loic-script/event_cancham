import type { DossierComplet } from "./contexte";
import { descendants } from "./dossiers";

export type OptionDossier = { id: string; libelle: string; profondeur: number };

export function optionsDossiers(dossiers: ReadonlyMap<string, DossierComplet>): OptionDossier[] {
  const enfants = new Map<string | null, DossierComplet[]>();
  for (const d of dossiers.values()) {
    const liste = enfants.get(d.parentId) ?? [];
    liste.push(d);
    enfants.set(d.parentId, liste);
  }
  const sortie: OptionDossier[] = [];
  const parcourir = (parent: string | null, profondeur: number) => {
    for (const d of (enfants.get(parent) ?? []).sort((a, b) => a.ordre - b.ordre || a.nom.localeCompare(b.nom, "fr"))) {
      sortie.push({ id: d.id, libelle: d.nom, profondeur });
      if (profondeur < 6) parcourir(d.id, profondeur + 1);
    }
  };
  parcourir(null, 1);
  return sortie;
}

export function descendantsDe(dossiers: ReadonlyMap<string, DossierComplet>, id: string): string[] {
  return [...descendants(dossiers, id)];
}
