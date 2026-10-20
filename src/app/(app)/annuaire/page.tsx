import type { Metadata } from "next";
import { Annuaire } from "@/components/traversee/annuaire/Annuaire";
import { fichesInscrits } from "@/lib/annuaire";
import { rdvDe } from "@/lib/rendezvous";
import { requireMembreActif } from "@/lib/session";

export const metadata: Metadata = { title: "Annuaire" };
export const dynamic = "force-dynamic";

export default async function AnnuairePage() {
  const user = await requireMembreActif();
  const [fiches, rdv] = await Promise.all([fichesInscrits(), rdvDe(user.id)]);
  return <Annuaire participants={fiches.filter((p) => p.userId !== user.id)} mesRdv={rdv.filter((r) => r.etat === "confirme" || r.etat === "attente")} />;
}
