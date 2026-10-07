"use client";

import { useSyncExternalStore } from "react";
import type { ChallengeSlug } from "@/lib/mock/challenges";

export type Participation = {
  slug: ChallengeSlug;
  submittedAt: string;
  status: "received";
  /** Photo réduite, en data URL (défis photo). */
  photo?: string;
  link?: string;
  /** Vidéo de pitch : seules les métadonnées sont conservées entre deux visites. */
  video?: { name: string; seconds: number; sizeMb: number };
  company?: string;
  pitch?: string;
};

type Store = Partial<Record<ChallengeSlug, Participation>>;

// Tant que les défis ne sont pas reliés au serveur, les participations
// vivent dans le navigateur. Le module expose un petit store observable.
const KEY = "event.participations.v1";
const EVENT = "event:participations";
const EMPTY: Store = {};

let cachedRaw: string | null = null;
let cachedValue: Store = EMPTY;

function read(): Store {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw === cachedRaw) return cachedValue;
  cachedRaw = raw;
  try {
    cachedValue = raw ? (JSON.parse(raw) as Store) : EMPTY;
  } catch {
    cachedValue = EMPTY;
  }
  return cachedValue;
}

function write(store: Store) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* quota dépassé ou stockage bloqué : la participation reste en mémoire de page */
    cachedRaw = null;
    cachedValue = store;
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

export function useParticipations(): Store {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function useParticipation(slug: ChallengeSlug): Participation | undefined {
  return useParticipations()[slug];
}

export function saveParticipation(p: Participation) {
  write({ ...read(), [p.slug]: p });
}

export function removeParticipation(slug: ChallengeSlug) {
  const next = { ...read() };
  delete next[slug];
  write(next);
}

/** Réduit une image à `max` px de côté et la renvoie en JPEG (data URL). */
export function shrinkImage(file: File, max = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
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
        reject(new Error("canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    img.src = url;
  });
}

/** Durée d'une vidéo en secondes, lue dans ses métadonnées. */
export function videoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("video"));
    };
    video.src = url;
  });
}
