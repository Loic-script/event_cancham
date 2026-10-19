import type { Metadata } from "next";
import { Programme } from "@/components/traversee/programme/Programme";
import { chargerProgramme } from "@/lib/programme";
import { requireMembreActif } from "@/lib/session";

export const metadata: Metadata = { title: "Programme" };

export default async function ProgrammePage() {
  const user = await requireMembreActif();
  return <Programme items={await chargerProgramme(user.id)} />;
}
