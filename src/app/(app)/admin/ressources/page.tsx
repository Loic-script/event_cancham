import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminEntete, PanneauDossier } from "@/components/bibliotheque/admin/AdminEntete";
import { AdminListe } from "@/components/bibliotheque/admin/AdminListe";
import { VueBibliotheque } from "@/components/bibliotheque/Bibliotheque";
import { contexteBibliotheque } from "@/lib/ressources/contexte";
import { descendantsDe, optionsDossiers } from "@/lib/ressources/options";
import { lireParametres, listerBibliotheque } from "@/lib/ressources/requetes";

export const metadata: Metadata = { title: "Ressources · Back-office" };
export const dynamic = "force-dynamic";

export default async function AdminRessourcesPage(props: PageProps<"/admin/ressources">) {
  const sp = await props.searchParams;
  const ctx = await contexteBibliotheque();
  const params = lireParametres(sp);
  const data = await listerBibliotheque(ctx, { ...params, verifierFichiers: true });
  if (!data) notFound();
  const options = optionsDossiers(ctx.dossiers);
  const d = data.dossier;
  const nbDirectes = data.recherche ? data.ressources.length : data.compteurs.tout;

  return (
    <VueBibliotheque
      data={data}
      params={params}
      base="/admin/ressources"
      lienRessource={(id) => `/admin/ressources/${id}`}
      equipe
      actionsEntete={<AdminEntete dossiers={options} dossierCourant={params.dossierId} />}
      apresBanniere={
        d ? (
          <PanneauDossier
            dossier={{ id: d.id, nom: d.nom, parentId: d.parentId, auteurNom: d.auteurNom, auteurRole: d.auteurRole, auteurBio: d.auteurBio, couverture: Boolean(d.couverture), auteurPhoto: Boolean(d.auteurPhoto) }}
            dossiers={options}
            interdits={descendantsDe(ctx.dossiers, d.id)}
            nbRessources={nbDirectes}
            nbSousDossiers={data.sousDossiers.length}
          />
        ) : null
      }
      listeRessources={
        <AdminListe
          key={data.ressources.map((r) => r.id).join(",")}
          ressources={data.ressources}
          dossierCourant={params.dossierId}
          dossiers={options}
          ordreManuel={Boolean(d) && !data.recherche && params.tri === "ordre" && params.filtre === "tout"}
          numeroter={Boolean(d) && !data.recherche}
        />
      }
    />
  );
}
