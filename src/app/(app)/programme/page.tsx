import type { Metadata } from "next";
import { CalendarDaysIcon } from "@/components/app/icons";
import { NonDisponible } from "@/components/traversee/NonDisponible";

export const metadata: Metadata = { title: "Programme" };

export default function ProgrammePage() {
  return <NonDisponible titre="Programme" texte="Le programme de la soirée n’est pas encore disponible. Il sera publié ici avant le gala du 18 décembre." icone={<CalendarDaysIcon />} />;
}
