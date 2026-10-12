import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DefiPitch } from "@/components/traversee/defis/DefiPitch";
import { DefiTombola } from "@/components/traversee/defis/DefiTombola";

const TITRES: Record<string, string> = { pitch: "Gagnez un voyage au Canada", tombola: "Gagnez 3 000 000 Ar" };

export async function generateMetadata(props: PageProps<"/defis/[defi]">): Promise<Metadata> {
  const { defi } = await props.params;
  return { title: TITRES[defi] ?? "Défis" };
}

export default async function DefiPage(props: PageProps<"/defis/[defi]">) {
  const { defi } = await props.params;
  if (defi === "pitch") return <DefiPitch />;
  if (defi === "tombola") return <DefiTombola />;
  notFound();
}
