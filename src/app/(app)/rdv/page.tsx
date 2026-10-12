import type { Metadata } from "next";
import { Rdv } from "@/components/traversee/annuaire/Rdv";

export const metadata: Metadata = { title: "Mes rendez-vous" };

export default function RdvPage() {
  return <Rdv />;
}
