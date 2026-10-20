"use client";

import { createContext, createElement, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { enregistrerProfil } from "@/app/(app)/profil/actions";
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
  phone: string;
  linkedin: string;
  email: string;
  photo: string;
  blocked: string[];
  passwordChangedAt: string;
}>;

export type Profile = typeof currentUser & { photo?: string; phone?: string; blocked: string[]; passwordChangedAt?: string };

export type SessionIdentity = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string | null;
  company: string | null;
  sector: string | null;
  bio: string | null;
  phone: string | null;
  website: string | null;
  city: string | null;
  country: string | null;
  acces: "MEMBRE" | "ADMIN";
  superAdmin: boolean;
  photo: string | null;
  /** Code du billet (QR) et règlement, depuis la base. */
  codeBillet: string;
  billetPaye: boolean;
  createdAt: string;
};

const BASE_KEY = "event.profile.v1";
const SYNCHRONISES = ["firstName", "lastName", "company", "role", "sector", "bio", "phone", "website", "city"] as const;
const EVENT = "event:profile";
const EMPTY: ProfileOverrides = {};

const SessionIdentityContext = createContext<SessionIdentity | null>(null);

let activeKey = BASE_KEY;
const cache = new Map<string, { raw: string | null; value: ProfileOverrides }>();

function keyFor(identity: SessionIdentity | null) {
  return identity ? `${BASE_KEY}.u${identity.id}` : BASE_KEY;
}

function read(key: string): ProfileOverrides {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    raw = null;
  }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value;
  let value: ProfileOverrides = EMPTY;
  try {
    value = raw ? (JSON.parse(raw) as ProfileOverrides) : EMPTY;
  } catch {
    value = EMPTY;
  }
  cache.set(key, { raw, value });
  return value;
}

function write(key: string, next: ProfileOverrides) {
  try {
    window.localStorage.setItem(key, JSON.stringify(next));
  } catch {
    cache.set(key, { raw: null, value: next });
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

function identityFields(identity: SessionIdentity | null): Partial<Profile> {
  if (!identity) return {};
  return {
    firstName: identity.firstName,
    lastName: identity.lastName,
    email: identity.email,
    role: identity.role ?? "",
    company: identity.company ?? "",
    sector: identity.sector ?? "",
    bio: identity.bio ?? "",
    phone: identity.phone ?? "",
    website: identity.website ?? "",
    city: identity.city ?? "",
    country: identity.country === "CA" ? "CA" : "MG",
    memberSince: identity.createdAt.slice(0, 10),
    photo: identity.photo ?? undefined,
  };
}

export function SessionIdentityProvider({ user, children }: { user: SessionIdentity; children: ReactNode }) {
  useEffect(() => {
    activeKey = keyFor(user);
    return () => {
      activeKey = BASE_KEY;
    };
  }, [user]);
  return createElement(SessionIdentityContext.Provider, { value: user }, children);
}

export function useSessionIdentity(): SessionIdentity | null {
  return useContext(SessionIdentityContext);
}

export function useProfileOverrides(): ProfileOverrides {
  const key = keyFor(useSessionIdentity());
  return useSyncExternalStore(
    subscribe,
    () => read(key),
    () => EMPTY,
  );
}

export function useProfile(): Profile {
  const identity = useSessionIdentity();
  // La photo et l'adresse e-mail viennent du compte (serveur) : d'anciennes valeurs gardées dans ce navigateur ne les remplacent pas.
  const { photo: _photoLocale, email: _emailLocal, passwordChangedAt: _mdpLocal, ...o } = useProfileOverrides();
  void _photoLocale;
  void _emailLocal;
  void _mdpLocal;
  return { ...currentUser, ...identityFields(identity), blocked: [], ...o };
}

export function updateProfile(patch: ProfileOverrides) {
  write(activeKey, { ...read(activeKey), ...patch });
  if (activeKey === BASE_KEY) return;
  const champs = Object.fromEntries(SYNCHRONISES.filter((k) => typeof patch[k] === "string").map((k) => [k, patch[k] as string]));
  if (Object.keys(champs).length) void enregistrerProfil(champs).catch(() => undefined);
}

/** Oublie les valeurs gardées dans le navigateur pour ces champs, pour revenir à celles du compte. */
export function oublierChampsLocaux(champs: (keyof ProfileOverrides)[]) {
  const actuel = read(activeKey);
  if (!champs.some((c) => c in actuel)) return;
  const suite = { ...actuel };
  for (const c of champs) delete suite[c];
  write(activeKey, suite);
}

export function resetProfile() {
  write(activeKey, {});
}
