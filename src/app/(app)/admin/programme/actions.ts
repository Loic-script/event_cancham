"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { estAdmin } from "@/lib/session";
import { CATS, IMAGES, LIEU, type ProgCat } from "@/lib/traversee/data";

type Resultat = { error: string | null };

export type DonneesRendezVous = { titre?: unknown; categorie?: unknown; heure?: unknown; lieu?: unknown; places?: unknown; resume?: unknown; details?: unknown; image?: unknown };

const NON_ADMIN: Resultat = { error: "Action réservée aux administrateurs." };

const texte = (v: unknown) => (typeof v === "string" ? v.trim() : "");

function rafraichir() {
  revalidatePath("/programme", "layout");
  revalidatePath("/admin/programme");
}

function valider(d: DonneesRendezVous) {
  const titre = texte(d.titre);
  const heure = texte(d.heure);
  const resume = texte(d.resume);
  const details = texte(d.details);
  const lieu = texte(d.lieu) || LIEU;
  const places = Number(d.places ?? 0);
  if (!titre) return { error: "Le titre est obligatoire." };
  if (!heure) return { error: "L’heure est obligatoire." };
  if (!resume) return { error: "Le résumé est obligatoire." };
  if (titre.length > 160) return { error: "Le titre ne doit pas dépasser 160 caractères." };
  if (heure.length > 60) return { error: "L’heure ne doit pas dépasser 60 caractères." };
  if (lieu.length > 160) return { error: "Le lieu ne doit pas dépasser 160 caractères." };
  if (resume.length > 300) return { error: "Le résumé ne doit pas dépasser 300 caractères." };
  if (details.length > 4000) return { error: "Les détails ne doivent pas dépasser 4 000 caractères." };
  if (!Number.isInteger(places) || places < 0 || places > 100_000) return { error: "Indiquez un nombre de places entier (0 pour un accès libre)." };
  if (!CATS.includes(d.categorie as ProgCat)) return { error: "Choisissez une catégorie." };
  if (!IMAGES.includes(d.image as string)) return { error: "Choisissez une photo." };
  return { error: null, data: { titre, heure, resume, details, lieu, places, categorie: d.categorie as ProgCat, image: d.image as string } };
}

/** Ajoute un rendez-vous (id null, placé en fin de programme) ou modifie celui dont l'id est donné. */
export async function enregistrerRendezVous(id: string | null, d: DonneesRendezVous): Promise<Resultat> {
  if (!(await estAdmin())) return NON_ADMIN;
  const v = valider(d);
  if (!v.data) return { error: v.error };

  if (id) {
    const { count } = await prisma.rendezVousProgramme.updateMany({ where: { id }, data: v.data });
    if (!count) return { error: "Ce rendez-vous n’existe plus." };
  } else {
    const dernier = await prisma.rendezVousProgramme.aggregate({ _max: { ordre: true } });
    await prisma.rendezVousProgramme.create({ data: { ...v.data, ordre: (dernier._max.ordre ?? -1) + 1 } });
  }
  rafraichir();
  return { error: null };
}

/** Supprime le rendez-vous et ses inscriptions. */
export async function supprimerRendezVous(id: unknown): Promise<Resultat> {
  if (!(await estAdmin())) return NON_ADMIN;
  if (typeof id !== "string") return { error: "Ce rendez-vous n’existe plus." };
  const { count } = await prisma.rendezVousProgramme.deleteMany({ where: { id } });
  if (!count) return { error: "Ce rendez-vous n’existe plus." };
  rafraichir();
  return { error: null };
}
