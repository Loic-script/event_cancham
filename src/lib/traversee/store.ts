"use client";

import { useSyncExternalStore } from "react";
import type { AnnonceType } from "./data";

export type Annonce = { id: string; titre: string; message: string; type: AnnonceType; cta: string; img?: string; t: number };
export type Fiche = { nom: string; role: string; ent: string; sect: string; act: string; email: string; phone: string; website: string; billet: "paye" | "attente" };
export type TypeNotif = "annonce" | "message" | "compte" | "publication" | "story" | "defi1" | "defi2" | "rdv" | "livre";

export type TraverseeState = {
  storiesVues: Record<string, 1>;
  notifsLues: Record<string, 1>;
};

export const DEFAULT_STATE: TraverseeState = {
  storiesVues: {},
  notifsLues: {},
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
