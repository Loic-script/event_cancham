import type { Metadata } from "next";
import { Annuaire } from "@/components/traversee/annuaire/Annuaire";

export const metadata: Metadata = { title: "Annuaire" };

export default function AnnuairePage() {
  return <Annuaire />;
}
