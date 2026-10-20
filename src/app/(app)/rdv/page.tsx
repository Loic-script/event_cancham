import type { Metadata } from "next";
import { Rdv } from "@/components/traversee/annuaire/Rdv";
import { rdvDe } from "@/lib/rendezvous";
import { requireMembreActif } from "@/lib/session";

export const metadata: Metadata = { title: "Mes rendez-vous" };
export const dynamic = "force-dynamic";

export default async function RdvPage() {
  const user = await requireMembreActif();
  return <Rdv rdv={await rdvDe(user.id)} />;
}
