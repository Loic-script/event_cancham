import type { Metadata } from "next";
import { Annuaire } from "@/components/traversee/annuaire/Annuaire";

export const metadata: Metadata = { title: "Annuaire · Back-office" };

export default function Page() {
  return <Annuaire admin />;
}
