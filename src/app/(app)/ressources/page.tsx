import type { Metadata } from "next";
import { Ressources } from "@/components/traversee/ressources/Ressources";

export const metadata: Metadata = { title: "Ressources" };

export default function RessourcesPage() {
  return <Ressources />;
}
