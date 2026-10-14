import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccesRequis } from "@/components/bibliotheque/Acces";
import { PageLecture } from "@/components/bibliotheque/Lecture";
import { contexteBibliotheque } from "@/lib/ressources/contexte";
import { etapesDossier } from "@/lib/ressources/requetes";
import { idValide } from "@/lib/ressources/stockage";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/ressources/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: idValide(id) ? "Lecture · Ressources" : "Ressources", robots: { index: false, follow: false } };
}

export default async function LecturePage(props: PageProps<"/ressources/[id]">) {
  const { id } = await props.params;
  const ctx = await contexteBibliotheque();
  if (!ctx.session) return <AccesRequis type="connexion" suite={`/ressources/${id}`} />;
  if (!ctx.bibliotheque) return <AccesRequis type="cotisation" nom={ctx.session.prenom} />;
  if (!idValide(id)) notFound();
  const r = await prisma.ressource.findUnique({
    where: { id },
    select: { id: true, titre: true, description: true, format: true, taille: true, pages: true, prix: true, type: true, contenu: true, dossierId: true, dossier: { select: { id: true, nom: true } } },
  });
  if (!r) notFound();
  const decision = ctx.lecture(r);
  if (decision === "introuvable" || decision === "interdit") notFound();
  const [etapes, lecture] = await Promise.all([
    r.dossierId ? etapesDossier(ctx, r.dossierId) : Promise.resolve([]),
    prisma.lectureRessource.findUnique({ where: { utilisateurId_ressourceId: { utilisateurId: ctx.session.id, ressourceId: r.id } }, select: { id: true } }),
  ]);
  return (
    <PageLecture
      r={r}
      decision={decision}
      lue={Boolean(lecture)}
      etapes={etapes}
      lienRessource={(x) => `/ressources/${x}`}
      lienRetour={r.dossier ? `/ressources?dossier=${r.dossier.id}` : "/ressources"}
      libelleRetour={r.dossier ? "Retour au dossier" : "Retour à la bibliothèque"}
      contact="/messages/c1"
      equipe={ctx.equipe}
    />
  );
}
