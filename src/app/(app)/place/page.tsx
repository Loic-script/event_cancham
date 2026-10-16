import type { Metadata } from "next";
import { ArmchairIcon } from "@/components/app/icons";
import { NonDisponible } from "@/components/traversee/NonDisponible";

export const metadata: Metadata = { title: "Ma place" };

export default function PlacePage() {
  return <NonDisponible titre="Ma place" texte="Le choix de votre table et de votre chaise pour le gala n’est pas encore ouvert. Il sera disponible ici prochainement." icone={<ArmchairIcon />} />;
}
