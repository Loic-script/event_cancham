"use client";

import { useSyncExternalStore } from "react";
import { currentUser, type Country } from "@/lib/mock/data";

export type ProfileOverrides = Partial<{
  firstName: string;
  lastName: string;
  bio: string;
  company: string;
  role: string;
  sector: string;
  city: string;
  country: Country;
  website: string;
  linkedin: string;
  email: string;
  photo: string;
  blocked: string[];
  passwordChangedAt: string;
}>;

export type Profile = typeof currentUser & { photo?: string; blocked: string[]; passwordChangedAt?: string };

const KEY = "event.profile.v1";
const EVENT = "event:profile";
const EMPTY: ProfileOverrides = {};

let cachedRaw: string | null = null;
let cachedValue: ProfileOverrides = EMPTY;

function read(): ProfileOverrides {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw === cachedRaw) return cachedValue;
  cachedRaw = raw;
  try {
    cachedValue = raw ? (JSON.parse(raw) as ProfileOverrides) : EMPTY;
  } catch {
    cachedValue = EMPTY;
  }
  return cachedValue;
}

function write(next: ProfileOverrides) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    cachedRaw = null;
    cachedValue = next;
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

export function useProfileOverrides(): ProfileOverrides {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function useProfile(): Profile {
  const o = useProfileOverrides();
  return { ...currentUser, blocked: [], ...o };
}

export function updateProfile(patch: ProfileOverrides) {
  write({ ...read(), ...patch });
}

export function resetProfile() {
  write({});
}
