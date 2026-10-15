import type { Metadata } from "next";
import { Annuaire } from "@/components/traversee/annuaire/Annuaire";
import { fichesInscrits } from "@/lib/annuaire";

export const metadata: Metadata = { title: "Annuaire · Back-office" };

export default async function Page() {
  return <Annuaire admin participants={await fichesInscrits()} />;
}
