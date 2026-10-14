import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { membreAJour, type Profil } from "@/lib/ressources/acces";

export const NOM_COOKIE = "cc_session";
const DUREE_S = 60 * 60 * 24 * 14;

export type SessionUtilisateur = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  role: "equipe" | "contact";
  membre: { id: string; nom: string; cotisationJusquAu: Date | null; aJour: boolean } | null;
};

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET doit être défini (16 caractères minimum).");
  return createHash("sha256").update(`session-dev:${process.env.DATABASE_URL ?? "event"}`).digest("hex");
}

export function signerJeton(utilisateurId: string, expireLe: number): string {
  const corps = Buffer.from(JSON.stringify({ u: utilisateurId, e: expireLe })).toString("base64url");
  const signature = createHmac("sha256", secret()).update(corps).digest("base64url");
  return `${corps}.${signature}`;
}

export function lireJeton(jeton: string | undefined | null, maintenant = Date.now()): string | null {
  if (!jeton) return null;
  const [corps, signature] = jeton.split(".");
  if (!corps || !signature) return null;
  const attendue = createHmac("sha256", secret()).update(corps).digest();
  const recue = Buffer.from(signature, "base64url");
  if (attendue.length !== recue.length || !timingSafeEqual(attendue, recue)) return null;
  try {
    const { u, e } = JSON.parse(Buffer.from(corps, "base64url").toString("utf8")) as { u?: unknown; e?: unknown };
    if (typeof u !== "string" || typeof e !== "number" || e < maintenant) return null;
    return u;
  } catch {
    return null;
  }
}

export async function ouvrirSession(utilisateurId: string): Promise<void> {
  const magasin = await cookies();
  magasin.set(NOM_COOKIE, signerJeton(utilisateurId, Date.now() + DUREE_S * 1000), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DUREE_S,
  });
}

export async function fermerSession(): Promise<void> {
  (await cookies()).delete(NOM_COOKIE);
}

export const sessionCourante = cache(async (): Promise<SessionUtilisateur | null> => {
  const id = lireJeton((await cookies()).get(NOM_COOKIE)?.value);
  if (!id) return null;
  const u = await prisma.utilisateur.findUnique({
    where: { id },
    select: { id: true, prenom: true, nom: true, email: true, role: true, membre: { select: { id: true, nom: true, cotisationJusquAu: true } } },
  });
  if (!u) return null;
  return {
    id: u.id,
    prenom: u.prenom,
    nom: u.nom,
    email: u.email,
    role: u.role,
    membre: u.membre ? { ...u.membre, aJour: membreAJour(u.membre.cotisationJusquAu) } : null,
  };
});

export function profilDe(session: SessionUtilisateur | null): Profil {
  if (!session) return null;
  return { equipe: session.role === "equipe", membreId: session.membre?.id ?? null, aJour: Boolean(session.membre?.aJour) };
}

export function nomComplet(session: Pick<SessionUtilisateur, "prenom" | "nom">): string {
  return `${session.prenom} ${session.nom}`.trim();
}
