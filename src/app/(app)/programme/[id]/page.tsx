import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProgrammeDetail } from "@/components/traversee/programme/Programme";
import { chargerRendezVous } from "@/lib/programme";
import { requireMembreActif } from "@/lib/session";

export const metadata: Metadata = { title: "Programme" };

export default async function ProgrammeDetailPage(props: PageProps<"/programme/[id]">) {
  const { id } = await props.params;
  const user = await requireMembreActif();
  const item = await chargerRendezVous(id, user.id);
  if (!item) notFound();
  return <ProgrammeDetail item={item} />;
}
