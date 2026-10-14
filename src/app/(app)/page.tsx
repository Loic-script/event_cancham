import type { Metadata } from "next";
import { Accueil } from "@/components/traversee/accueil/Accueil";

export const metadata: Metadata = { title: "Accueil" };

export default function HomePage() {
  return <Accueil />;
}
