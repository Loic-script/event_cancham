import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Limite des tentatives de connexion : au-delà d'un nombre d'échecs sur une fenêtre glissante,
 * l'adresse e-mail (ou l'adresse IP) attend la fin du blocage avant un nouvel essai.
 * Les échecs sont gardés en base (table tentatives_connexion), donc comptés même après un redémarrage.
 */
export const FENETRE_MS = 15 * 60 * 1000;
export const MAX_ECHECS_EMAIL = 5;
export const MAX_ECHECS_IP = 30;

/** Minutes d'attente restantes (0 : pas de blocage) d'après les dates des échecs dans la fenêtre. */
export function minutesDeBlocage(echecs: Date[], max: number, maintenant = Date.now()): number {
  const recents = echecs.filter((d) => d.getTime() > maintenant - FENETRE_MS);
  if (recents.length < max) return 0;
  const dernier = Math.max(...recents.map((d) => d.getTime()));
  return Math.max(1, Math.ceil((dernier + FENETRE_MS - maintenant) / 60_000));
}

export function messageBlocage(minutes: number): string {
  return `Trop de tentatives. Réessayez dans ${minutes} minute${minutes > 1 ? "s" : ""}.`;
}

/** Adresse IP du client, derrière le proxy de l'hébergeur. */
export async function adresseClient(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "inconnue").split(",")[0].trim().slice(0, 100);
}

const cleEmail = (email: string) => `email:${email.toLowerCase()}`;
const cleIp = (ip: string) => `ip:${ip}`;

async function echecsDe(cle: string): Promise<Date[]> {
  const lignes = await prisma.tentativeConnexion.findMany({ where: { cle, creeLe: { gt: new Date(Date.now() - FENETRE_MS) } }, select: { creeLe: true } });
  return lignes.map((l) => l.creeLe);
}

/** Message de blocage à afficher, ou null si la tentative est permise. */
export async function verifierLimiteConnexion(email: string, ip: string): Promise<string | null> {
  const [parEmail, parIp] = await Promise.all([echecsDe(cleEmail(email)), echecsDe(cleIp(ip))]);
  const minutes = Math.max(minutesDeBlocage(parEmail, MAX_ECHECS_EMAIL), minutesDeBlocage(parIp, MAX_ECHECS_IP));
  return minutes ? messageBlocage(minutes) : null;
}

export async function enregistrerEchecConnexion(email: string, ip: string): Promise<void> {
  await prisma.tentativeConnexion.createMany({ data: [{ cle: cleEmail(email) }, { cle: cleIp(ip) }] });
  // Les échecs sortis de la fenêtre ne servent plus : ménage au fil de l'eau.
  await prisma.tentativeConnexion.deleteMany({ where: { creeLe: { lt: new Date(Date.now() - 2 * FENETRE_MS) } } });
}

/** Connexion réussie : le compteur de cette adresse e-mail repart de zéro. */
export async function effacerEchecsConnexion(email: string): Promise<void> {
  await prisma.tentativeConnexion.deleteMany({ where: { cle: cleEmail(email) } });
}
