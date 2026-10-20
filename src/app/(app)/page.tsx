import type { Metadata } from "next";
import { Accueil } from "@/components/traversee/accueil/Accueil";
import { chargerFil } from "@/lib/fil";
import { promotions, storiesAccueil } from "@/lib/galerie";
import { requireMembreActif } from "@/lib/session";

export const metadata: Metadata = { title: "Accueil" };

export default async function HomePage() {
  const user = await requireMembreActif();
  const [fil, stories, promos] = await Promise.all([chargerFil(user.id), storiesAccueil(), promotions()]);
  return <Accueil fil={fil} stories={stories} promos={promos} />;
}
