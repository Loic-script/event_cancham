import type { Metadata } from "next";
import { VideoIcon } from "@/components/app/icons";
import { NonDisponible } from "@/components/traversee/NonDisponible";

export const metadata: Metadata = { title: "Livre d’or vidéo" };

export default function LivrePage() {
  return <NonDisponible titre="Livre d’or vidéo" texte="Le livre d’or vidéo ouvrira le soir du gala : vous pourrez y laisser un message pour les 10 ans de la CanCham." icone={<VideoIcon />} />;
}
