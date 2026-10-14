import { personnes, type Personne } from "./data";
import type { Fiche, TraverseeState } from "./store";

export type FicheComplete = Fiche & { id: string; img: string; code: string };

const PERSONNES = personnes();

export function sansAccent(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function codeBillet(i: number) {
  return `TRV26-GALA-${String(101 + i * 37).padStart(4, "0")}`;
}

export function ficheDe(p: Personne, i: number): FicheComplete {
  const [prenom, nom] = p.nom.split(" ");
  const domaine = sansAccent(p.ent).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return {
    id: p.nom,
    img: p.img,
    code: codeBillet(i),
    nom: p.nom,
    role: p.role,
    ent: p.ent,
    sect: p.sect,
    act: p.act,
    email: `${sansAccent(prenom)}.${sansAccent(nom ?? "")}@${domaine}.mg`,
    phone: `+261 34 ${String(10 + i * 7).padStart(2, "0")} ${String(100 + i * 53).slice(-3)} ${String(10 + i * 3).padStart(2, "0")}`,
    website: `https://www.${domaine}.mg`,
    billet: i % 5 === 3 ? "attente" : "paye",
  };
}

export function fichesParticipants(s: TraverseeState): FicheComplete[] {
  return PERSONNES.map((p, i) => ({ ...ficheDe(p, i), ...(s.fiches[p.nom] as Partial<Fiche> | undefined) })).sort((x, y) => (x.nom < y.nom ? -1 : 1));
}
