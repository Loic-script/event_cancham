import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageLecture } from "@/components/bibliotheque/Lecture";
import { contexteBibliotheque } from "@/lib/ressources/contexte";
import { etapesDossier } from "@/lib/ressources/requetes";
import { idValide } from "@/lib/ressources/stockage";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lecture · Ressources", robots: { index: false, follow: false } };

export default async function LecturePage(props: PageProps<"/ressources/[id]">) {
  const { id } = await props.params;
  if (!idValide(id)) notFound();
  const ctx = await contexteBibliotheque();
  const r = await prisma.ressource.findUnique({
    where: { id },
    select: { id: true, titre: true, description: true, format: true, taille: true, pages: true, contenu: true, dossierId: true, dossier: { select: { id: true, nom: true } } },
  });
  if (!r) notFound();
  const [etapes, lecture] = await Promise.all([
    r.dossierId ? etapesDossier(ctx, r.dossierId) : Promise.resolve([]),
    ctx.lecteur ? prisma.lectureRessource.findUnique({ where: { lecteur_ressourceId: { lecteur: ctx.lecteur, ressourceId: r.id } }, select: { id: true } }) : Promise.resolve(null),
  ]);
  return (
    <PageLecture
      r={r}
      lue={Boolean(lecture)}
      etapes={etapes}
      lienRessource={(x) => `/ressources/${x}`}
      lienRetour={r.dossier ? `/ressources?dossier=${r.dossier.id}` : "/ressources"}
      libelleRetour={r.dossier ? "Retour au dossier" : "Retour à la bibliothèque"}
    />
  );
}
