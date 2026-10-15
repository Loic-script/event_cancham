import { fichesParticipants } from "./participants";
import type { TraverseeState } from "./store";

export type DefiAdmin = "pitch" | "tombola";

export type Candidature = {
  id: string;
  porteur: string;
  ent: string;
  role: string;
  sect: string;
  lien: string;
  envoi: number;
  moi: boolean;
  reactions?: number;
};

export type Moi = { nom: string; ent: string; role: string; sect: string };

const RETENUS = [0, 2, 3, 5, 7, 8, 10, 12, 14];
const DEBUT_PITCH = Date.UTC(2026, 10, 18, 9, 0);
const DEBUT_TOMBOLA = Date.UTC(2026, 9, 20, 8, 30);
const B64 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-";

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

function lienVideoDe(nom: string, i: number): string {
  if (i % 3 === 0) return `https://drive.google.com/file/d/1${empreinte(nom, 32, B64)}/view?usp=sharing`;
  if (i % 3 === 1) return `https://youtu.be/${empreinte(nom, 11, B64)}`;
  return `https://vimeo.com/${empreinte(nom, 9, "0123456789").replace(/^0/, "8")}`;
}

function slug(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export function idPublication(nom: string): string {
  return `pub-${slug(nom)}`;
}

function lienPublicationDe(nom: string, i: number): string {
  if (i % 3 === 2) return `https://www.instagram.com/p/${empreinte(nom, 11, B64)}/`;
  return `https://www.facebook.com/${slug(nom)}/posts/pfbid0${empreinte(nom, 40, "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ123456789")}`;
}

export function candidaturesPitch(s: TraverseeState, moi: Moi): Candidature[] {
  const fiches = fichesParticipants(s);
  const liste: Candidature[] = RETENUS.filter((i) => i < fiches.length).map((i, k) => {
    const f = fiches[i];
    return { id: f.id, porteur: f.nom, ent: f.ent, role: f.role, sect: f.sect, lien: lienVideoDe(f.nom, k), envoi: DEBUT_PITCH + k * 37 * 3600 * 1000 + (k % 4) * 23 * 60 * 1000, moi: false };
  });
  if (s.pitchEnvoye && s.pitch) {
    liste.push({ id: "moi", porteur: moi.nom, ent: moi.ent, role: moi.role, sect: moi.sect, lien: s.pitch, envoi: Date.UTC(2026, 11, 2, 15, 12), moi: true });
  }
  return liste;
}

export function candidaturesTombola(s: TraverseeState, moi: Moi): Candidature[] {
  const fiches = fichesParticipants(s);
  const liste: Candidature[] = s.classement.map((c, k) => {
    const f = fiches.find((x) => x.ent === c.nom);
    const porteur = f?.nom ?? c.nom;
    return {
      id: idPublication(c.nom),
      porteur,
      ent: c.nom,
      role: f?.role ?? "Participant",
      sect: f?.sect ?? "Autre",
      lien: lienPublicationDe(c.nom, k),
      envoi: DEBUT_TOMBOLA + k * 29 * 3600 * 1000 + (k % 3) * 41 * 60 * 1000,
      moi: false,
      reactions: c.reactions,
    };
  });
  if (s.lienPub) {
    liste.push({ id: "moi", porteur: moi.nom, ent: moi.ent, role: moi.role, sect: moi.sect, lien: s.lienPub, envoi: s.lienReactions?.at ?? Date.UTC(2026, 10, 2, 11, 4), moi: true, reactions: s.lienReactions?.reactions ?? 0 });
  }
  return liste;
}

export const NOTE_MAX = 20;
