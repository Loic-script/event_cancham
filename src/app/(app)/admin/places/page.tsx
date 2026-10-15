import type { Metadata } from "next";
import { ArmchairIcon } from "@/components/app/icons";
import { NonDisponible } from "@/components/traversee/NonDisponible";

export const metadata: Metadata = { title: "Places · Back-office" };

export default function Page() {
  return <NonDisponible titre="Places" texte="Le plan de salle et l’attribution des tables ne sont pas encore ouverts. Ils seront disponibles ici prochainement." icone={<ArmchairIcon />} retour="/admin" />;
}
