import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DefiPitch } from "@/components/traversee/defis/DefiPitch";
import { DefiTombola } from "@/components/traversee/defis/DefiTombola";
import { maParticipation, participants } from "@/lib/defis";
import { requireMembreActif } from "@/lib/session";
import { CLASSEMENT_VISIBLE } from "@/lib/traversee/pitchs";

const TITRES: Record<string, string> = { pitch: "Gagnez un voyage au Canada", tombola: "Gagnez 3 000 000 Ar" };

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/defis/[defi]">): Promise<Metadata> {
  const { defi } = await props.params;
  return { title: TITRES[defi] ?? "Défis" };
}

export default async function DefiPage(props: PageProps<"/defis/[defi]">) {
  const { defi } = await props.params;
  if (defi !== "pitch" && defi !== "tombola") notFound();
  const user = await requireMembreActif();
  if (defi === "pitch") {
    const [monPitch, maPublication] = await Promise.all([maParticipation(user.id, "pitch"), maParticipation(user.id, "tombola")]);
    return <DefiPitch monPitch={monPitch} aPublie={Boolean(maPublication)} />;
  }
  // Le classement n'est envoyé au navigateur que lorsqu'il est ouvert aux participants.
  const [maPublication, classement] = await Promise.all([maParticipation(user.id, "tombola"), CLASSEMENT_VISIBLE ? participants("tombola") : Promise.resolve([])]);
  return <DefiTombola maPublication={maPublication} classement={classement} monId={user.id} />;
}
