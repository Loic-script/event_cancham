"use client";

import { useSyncExternalStore } from "react";
import {
  CLASSEMENT_INIT,
  COMMANDES,
  DEMI,
  DOSSIERS,
  LIVRE,
  PROGRAMME,
  PROMOS,
  RESSOURCES,
  STORIES,
  VOIX_INIT,
  type AnnonceType,
  type Commande,
  type Demi,
  type Dossier,
  type ProgItem,
  type Promo,
  type Ressource,
  type Sieges,
  type Souvenir,
  type Story,
} from "./data";

export type Rdv = { id: string; avec: string; ci: number; li: number; etat: "attente" | "confirme" | "decline" | "expire"; t: number; note?: string };
export type Demande = { id: string; avec: string; ci: number; li: number };
export type Achat = { quoi: string; ou: string; montant: number; etat: "Payé" | "À régler à table"; date: string };
export type PostPerso = { id: string; texte: string; img?: string; t: number };
export type Pub = { id: string; texte: string; img?: string; date: string };
export type Annonce = { id: string; titre: string; message: string; type: AnnonceType; cta: string; img?: string; t: number };
export type MediaAjoute = { id: string; src: string };
export type AConv = { id: string; nom: string; ent: string; m: { de: "eux" | "moi"; texte: string; h: string }[] };
export type Fiche = { nom: string; role: string; ent: string; sect: string; act: string; email: string; phone: string; website: string; billet: "paye" | "attente" };

export type TraverseeState = {
  prog: Record<string, boolean>;
  table: number | null;
  siege: number | null;
  aime: Record<string, boolean>;
  posts: PostPerso[];
  pitch: string | null;
  pitchEnvoye: boolean;
  lienPub: string;
  lienReactions: { reactions: number; comments: number; shares: number; at: number } | null;
  lienReleve: string | null;
  vote: number | null;
  voteFinal: number | null;
  finale: boolean;
  ami: boolean;
  achats: Achat[];
  rdv: Rdv[];
  demandes: Demande[];
  visage: boolean;
  plan: boolean;
  retrouve: boolean;
  annonces: Annonce[];
  annoncesVues: Record<string, 1>;
  storiesVues: Record<string, 1>;
  programme: ProgItem[];
  demi: Demi[];
  voix: number[];
  classement: { nom: string; reactions: number }[];
  pubs: Pub[];
  livre: Souvenir[];
  ress: Ressource[];
  dossiers: Dossier[];
  cmd: Commande[];
  sieges: Sieges | null;
  promos: Promo[];
  stories: Story[];
  galSupprimees: string[];
  galAjoutees: MediaAjoute[];
  gagnant: string | null;
  aconv: AConv[];
  fiches: Record<string, Partial<Fiche>>;
};

export const DEFAULT_STATE: TraverseeState = {
  prog: {},
  table: null,
  siege: null,
  aime: {},
  posts: [],
  pitch: null,
  pitchEnvoye: false,
  lienPub: "",
  lienReactions: null,
  lienReleve: null,
  vote: null,
  voteFinal: null,
  finale: false,
  ami: false,
  achats: [{ quoi: "Billet La Traversée", ou: "Billetterie en ligne", montant: 500000, etat: "Payé", date: "Avant l’événement" }],
  rdv: [],
  demandes: [
    { id: "d1", avec: "Fara Rasoa · Zébu Finance", ci: 13, li: 1 },
    { id: "d2", avec: "Lova Rasoa · Ravinala Tourisme", ci: 7, li: 2 },
  ],
  visage: false,
  plan: true,
  retrouve: false,
  annonces: [],
  annoncesVues: {},
  storiesVues: {},
  programme: PROGRAMME,
  demi: DEMI,
  voix: VOIX_INIT,
  classement: CLASSEMENT_INIT,
  pubs: [],
  livre: LIVRE,
  ress: RESSOURCES,
  dossiers: DOSSIERS,
  cmd: COMMANDES,
  sieges: null,
  promos: PROMOS,
  stories: STORIES,
  galSupprimees: [],
  galAjoutees: [],
  gagnant: null,
  fiches: {},
  aconv: [
    { id: "a1", nom: "Hery Rabe", ent: "Baobab Conseil", m: [{ de: "eux", texte: "Bonjour, où puis-je retirer mon badge le 18 ?", h: "10:02" }] },
    { id: "a2", nom: "Miora Rajao", ent: "Hauts Plateaux Textile", m: [{ de: "eux", texte: "Peut-on changer de table après avoir réservé ?", h: "Hier" }, { de: "moi", texte: "Oui, depuis l’onglet Ma place : libérez votre chaise puis choisissez-en une autre.", h: "Hier" }] },
  ],
};

const KEY = "traversee.v1";
const EVENT = "traversee:change";

let cachedRaw: string | null = null;
let cachedValue: TraverseeState = DEFAULT_STATE;

function read(): TraverseeState {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw === cachedRaw) return cachedValue;
  cachedRaw = raw;
  try {
    cachedValue = raw ? { ...DEFAULT_STATE, ...(JSON.parse(raw) as Partial<TraverseeState>) } : DEFAULT_STATE;
  } catch {
    cachedValue = DEFAULT_STATE;
  }
  return cachedValue;
}

function write(next: TraverseeState) {
  cachedValue = next;
  try {
    const raw = JSON.stringify(next);
    window.localStorage.setItem(KEY, raw);
    cachedRaw = raw;
  } catch {
    cachedRaw = null;
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

export function useTraversee(): TraverseeState {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_STATE);
}

export function getTraversee(): TraverseeState {
  return typeof window === "undefined" ? DEFAULT_STATE : read();
}

export function setTraversee(patch: Partial<TraverseeState> | ((s: TraverseeState) => Partial<TraverseeState>)) {
  const current = read();
  const p = typeof patch === "function" ? patch(current) : patch;
  write({ ...current, ...p });
}

export function resetTraversee() {
  write(DEFAULT_STATE);
}

export function uid(prefix = "x") {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function toast(message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("traversee:toast", { detail: message }));
}

export function lisImage(file: File | undefined, max: number): Promise<string | null> {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        return resolve(null);
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}
