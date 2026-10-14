import { fichesParticipants } from "./participants";
import type { TraverseeState } from "./store";

export type Candidature = {
  id: string;
  porteur: string;
  ent: string;
  role: string;
  sect: string;
  lien: string;
  envoi: number;
  moi: boolean;
};

const RETENUS = [0, 2, 3, 5, 7, 8, 10, 12, 14];
const DEBUT = Date.UTC(2026, 10, 18, 9, 0);

function empreinte(texte: string, longueur: number, alphabet: string): string {
  let h = 2166136261;
  let sortie = "";
  for (let i = 0; sortie.length < longueur; i++) {
    h ^= texte.charCodeAt(i % texte.length) + i;
    h = Math.imul(h, 16777619) >>> 0;
    sortie += alphabet[h % alphabet.length];
  }
  return sortie;
}

function lienDe(nom: string, i: number): string {
  const b64 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-";
  if (i % 3 === 0) return `https://drive.google.com/file/d/1${empreinte(nom, 32, b64)}/view?usp=sharing`;
  if (i % 3 === 1) return `https://youtu.be/${empreinte(nom, 11, b64)}`;
  return `https://vimeo.com/${empreinte(nom, 9, "0123456789").replace(/^0/, "8")}`;
}

export function candidaturesPitch(s: TraverseeState, moi: { nom: string; ent: string; role: string; sect: string }): Candidature[] {
  const fiches = fichesParticipants(s);
  const liste: Candidature[] = RETENUS.filter((i) => i < fiches.length).map((i, k) => {
    const f = fiches[i];
    return { id: f.id, porteur: f.nom, ent: f.ent, role: f.role, sect: f.sect, lien: lienDe(f.nom, k), envoi: DEBUT + k * 37 * 3600 * 1000 + (k % 4) * 23 * 60 * 1000, moi: false };
  });
  if (s.pitchEnvoye && s.pitch) {
    liste.push({ id: "moi", porteur: moi.nom, ent: moi.ent, role: moi.role, sect: moi.sect, lien: s.pitch, envoi: Date.UTC(2026, 11, 2, 15, 12), moi: true });
  }
  return liste;
}

export const NOTE_MAX = 20;
