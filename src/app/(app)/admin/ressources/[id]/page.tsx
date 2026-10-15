import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OutilsRessource } from "@/components/bibliotheque/admin/OutilsRessource";
import { PageLecture } from "@/components/bibliotheque/Lecture";
import { contexteBibliotheque } from "@/lib/ressources/contexte";
import { optionsDossiers } from "@/lib/ressources/options";
import { contenuManquant, etapesDossier } from "@/lib/ressources/requetes";
import { idValide } from "@/lib/ressources/stockage";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Ressource · Back-office", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLecturePage(props: PageProps<"/admin/ressources/[id]">) {
  const { id } = await props.params;
  if (!idValide(id)) notFound();
  const ctx = await contexteBibliotheque();
  const r = await prisma.ressource.findUnique({
    where: { id },
    select: { id: true, titre: true, description: true, categorie: true, format: true, taille: true, pages: true, fichier: true, contenu: true, couverture: true, couverturePerso: true, dossierId: true, dossier: { select: { id: true, nom: true } } },
  });
  if (!r) notFound();
  const [etapes, manquant] = await Promise.all([r.dossierId ? etapesDossier(ctx, r.dossierId) : Promise.resolve([]), contenuManquant(r)]);
  return (
    <PageLecture
      r={r}
      lue={false}
      etapes={etapes}
      lienRessource={(x) => `/admin/ressources/${x}`}
      lienRetour={r.dossier ? `/admin/ressources?dossier=${r.dossier.id}` : "/admin/ressources"}
      libelleRetour={r.dossier ? "Retour au dossier" : "Retour à la bibliothèque"}
      terminer={false}
      avantContenu={
        <OutilsRessource
          ressource={{ id: r.id, titre: r.titre, categorie: r.categorie, description: r.description, dossierId: r.dossierId, couverture: Boolean(r.couverture), couverturePerso: r.couverturePerso, format: r.format }}
          dossiers={optionsDossiers(ctx.dossiers)}
          fichierManquant={manquant}
        />
      }
    />
  );
}
