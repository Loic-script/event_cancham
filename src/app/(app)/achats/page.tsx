import type { Metadata } from "next";
import { CartIcon } from "@/components/app/icons";
import { NonDisponible } from "@/components/traversee/NonDisponible";

export const metadata: Metadata = { title: "Achats" };

export default function AchatsPage() {
  return <NonDisponible titre="Achats" texte="La commande de boissons, de coffrets et de tirages photo n’est pas encore ouverte. Elle sera disponible ici prochainement." icone={<CartIcon />} />;
}
