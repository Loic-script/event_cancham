import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccesRequis } from "@/components/bibliotheque/Acces";
import { VueBibliotheque } from "@/components/bibliotheque/Bibliotheque";
import { contexteBibliotheque } from "@/lib/ressources/contexte";
import { lireParametres, listerBibliotheque } from "@/lib/ressources/requetes";

export const metadata: Metadata = { title: "Ressources" };
export const dynamic = "force-dynamic";

export default async function RessourcesPage(props: PageProps<"/ressources">) {
  const sp = await props.searchParams;
  const ctx = await contexteBibliotheque();
  if (!ctx.session) return <AccesRequis type="connexion" suite="/ressources" />;
  if (!ctx.bibliotheque) return <AccesRequis type="cotisation" nom={ctx.session.prenom} />;
  const params = lireParametres(sp);
  const data = await listerBibliotheque(ctx, params);
  if (!data) notFound();
  return <VueBibliotheque data={data} params={params} base="/ressources" lienRessource={(id) => `/ressources/${id}`} equipe={ctx.equipe} />;
}
