import type { Metadata } from "next";
import { CartIcon } from "@/components/app/icons";
import { NonDisponible } from "@/components/traversee/NonDisponible";

export const metadata: Metadata = { title: "Commandes · Back-office" };

export default function Page() {
  return <NonDisponible titre="Commandes" texte="Le suivi des commandes de boissons, de coffrets et de tirages photo n’est pas encore ouvert. Il sera disponible ici prochainement." icone={<CartIcon />} retour="/admin" />;
}
