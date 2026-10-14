import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type Moyen = { id: string; libelle: string };

export const MONTANT_MINIMUM = 100;

const MOYENS_SIMULATION: Moyen[] = [
  { id: "mvola", libelle: "MVola" },
  { id: "orange-money", libelle: "Orange Money" },
  { id: "carte", libelle: "Carte bancaire" },
];

export function paiementEnLigneActif(): boolean {
  return process.env.PAIEMENT_SIMULATION === "1";
}

export function moyensDisponibles(montant: number): Moyen[] {
  if (!paiementEnLigneActif() || montant < MONTANT_MINIMUM) return [];
  return MOYENS_SIMULATION;
}

export function moyenValide(id: string, montant: number): Moyen | null {
  return moyensDisponibles(montant).find((m) => m.id === id) ?? null;
}

function secret(): string {
  const s = process.env.PAIEMENT_SECRET;
  if (s && s.length >= 16) return s;
  return createHash("sha256").update(`paiement-dev:${process.env.DATABASE_URL ?? "event"}`).digest("hex");
}

export function signerNotification(corps: string): string {
  return createHmac("sha256", secret()).update(corps).digest("hex");
}

export function notificationAuthentique(corps: string, signature: string | null): boolean {
  if (!signature || !/^[0-9a-f]{64}$/i.test(signature)) return false;
  const attendue = Buffer.from(signerNotification(corps), "hex");
  const recue = Buffer.from(signature, "hex");
  return attendue.length === recue.length && timingSafeEqual(attendue, recue);
}

export type EtatPrestataire = "reussie" | "echouee" | "en_attente";

export function lireEtatPrestataire(etat: string | null): EtatPrestataire {
  if (etat === "paye") return "reussie";
  if (etat === "refuse") return "echouee";
  return "en_attente";
}
