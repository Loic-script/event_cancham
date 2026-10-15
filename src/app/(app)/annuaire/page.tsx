import type { Metadata } from "next";
import { Annuaire } from "@/components/traversee/annuaire/Annuaire";
import { fichesInscrits } from "@/lib/annuaire";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Annuaire" };

export default async function AnnuairePage() {
  const user = await requireUser();
  const participants = (await fichesInscrits()).filter((p) => p.userId !== user.id);
  return <Annuaire participants={participants} />;
}
