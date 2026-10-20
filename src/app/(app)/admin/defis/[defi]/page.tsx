import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminCandidatures } from "@/components/traversee/admin/AdminCandidatures";
import { AdminClassement } from "@/components/traversee/admin/AdminClassement";
import { participants } from "@/lib/defis";

const TITRES: Record<string, string> = { pitch: "Gagnez un voyage au Canada · Back-office", tombola: "Gagnez 3 000 000 Ar · Back-office" };

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/admin/defis/[defi]">): Promise<Metadata> {
  const { defi } = await props.params;
  return { title: TITRES[defi] ?? "Défis · Back-office" };
}

export default async function AdminDefiPage(props: PageProps<"/admin/defis/[defi]">) {
  const { defi } = await props.params;
  if (defi === "pitch") return <AdminCandidatures candidatures={await participants("pitch")} />;
  if (defi === "tombola") return <AdminClassement publications={await participants("tombola")} />;
  notFound();
}
