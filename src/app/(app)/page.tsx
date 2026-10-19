import type { Metadata } from "next";
import { Accueil } from "@/components/traversee/accueil/Accueil";
import { chargerFil } from "@/lib/fil";
import { requireMembreActif } from "@/lib/session";

export const metadata: Metadata = { title: "Accueil" };

export default async function HomePage() {
  const user = await requireMembreActif();
  return <Accueil fil={await chargerFil(user.id)} />;
}
