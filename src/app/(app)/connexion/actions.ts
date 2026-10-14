"use server";

import { redirect } from "next/navigation";
import { verifierMotDePasse } from "@/lib/auth/motdepasse";
import { fermerSession, ouvrirSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export type EtatConnexion = { erreur: string | null; email: string };

function destinationSure(valeur: FormDataEntryValue | null): string {
  const v = typeof valeur === "string" ? valeur : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : "/ressources";
}

export async function seConnecter(_etat: EtatConnexion, donnees: FormData): Promise<EtatConnexion> {
  const email = String(donnees.get("email") ?? "").trim().toLowerCase();
  const motDePasse = String(donnees.get("motDePasse") ?? "");
  if (!email || !motDePasse) return { erreur: "Saisissez votre adresse e-mail et votre mot de passe.", email };
  const u = await prisma.utilisateur.findUnique({ where: { email }, select: { id: true, motDePasse: true, role: true } });
  const ok = u ? await verifierMotDePasse(motDePasse, u.motDePasse) : false;
  if (!u || !ok) {
    await new Promise((r) => setTimeout(r, 400));
    return { erreur: "Adresse e-mail ou mot de passe incorrect.", email };
  }
  await ouvrirSession(u.id);
  const suite = destinationSure(donnees.get("suite"));
  redirect(u.role === "equipe" && suite === "/ressources" ? "/admin/ressources" : suite);
}

export async function seDeconnecter(): Promise<void> {
  await fermerSession();
  redirect("/connexion");
}
