"use client";

import { useSyncExternalStore } from "react";

export type ReponseEnvoi = { statut: number; corps: { ok?: boolean; message?: string; id?: string; fichier?: string; type?: string } };

export function televerser(url: string, methode: "POST" | "PUT", fichier: File, entetes: Record<string, string>, progression?: (pct: number) => void): Promise<ReponseEnvoi> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open(methode, url);
    for (const [k, v] of Object.entries(entetes)) xhr.setRequestHeader(k, v);
    xhr.setRequestHeader("Content-Type", fichier.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && progression) progression(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let corps: ReponseEnvoi["corps"] = {};
      try {
        corps = JSON.parse(xhr.responseText);
      } catch {
        corps = { ok: false, message: "Réponse inattendue du serveur." };
      }
      resolve({ statut: xhr.status, corps });
    };
    xhr.onerror = () => resolve({ statut: 0, corps: { ok: false, message: "Connexion interrompue pendant l’envoi." } });
    xhr.send(fichier);
  });
}

export const TAILLE_MAX_ENVOI = 490 * 1024 * 1024;

export type PressePapier = { mode: "couper" | "copier"; ressources: string[]; dossiers: string[]; libelle: string };

const CLE = "bibli.presse-papier.v1";
const EVENEMENT = "bibli:presse-papier";
let brutCache: string | null = null;
let valeurCache: PressePapier | null = null;

function lire(): PressePapier | null {
  let brut: string | null = null;
  try {
    brut = window.localStorage.getItem(CLE);
  } catch {
    brut = null;
  }
  if (brut === brutCache) return valeurCache;
  brutCache = brut;
  try {
    valeurCache = brut ? (JSON.parse(brut) as PressePapier) : null;
  } catch {
    valeurCache = null;
  }
  return valeurCache;
}

function abonner(rappel: () => void) {
  window.addEventListener("storage", rappel);
  window.addEventListener(EVENEMENT, rappel);
  return () => {
    window.removeEventListener("storage", rappel);
    window.removeEventListener(EVENEMENT, rappel);
  };
}

export function usePressePapier(): PressePapier | null {
  return useSyncExternalStore(abonner, lire, () => null);
}

export function ecrirePressePapier(valeur: PressePapier | null) {
  try {
    if (valeur) window.localStorage.setItem(CLE, JSON.stringify(valeur));
    else window.localStorage.removeItem(CLE);
  } catch {
    return;
  }
  window.dispatchEvent(new Event(EVENEMENT));
}

export type OptionDossier = { id: string; libelle: string; profondeur: number };
