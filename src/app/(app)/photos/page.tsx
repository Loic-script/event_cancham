import type { Metadata } from "next";
import { CameraIcon } from "@/components/app/icons";
import { NonDisponible } from "@/components/traversee/NonDisponible";

export const metadata: Metadata = { title: "Photos et vidéos" };

export default function PhotosPage() {
  return <NonDisponible titre="Photos et vidéos" texte="Les photos et vidéos du gala seront partagées ici après la soirée du 18 décembre." icone={<CameraIcon />} />;
}
