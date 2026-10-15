import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminDefi } from "@/components/traversee/admin/AdminDefis";

const TITRES: Record<string, string> = { pitch: "Gagnez un voyage au Canada · Back-office", tombola: "Gagnez 3 000 000 Ar · Back-office" };

export async function generateMetadata(props: PageProps<"/admin/defis/[defi]">): Promise<Metadata> {
  const { defi } = await props.params;
  return { title: TITRES[defi] ?? "Défis · Back-office" };
}

export default async function AdminDefiPage(props: PageProps<"/admin/defis/[defi]">) {
  const { defi } = await props.params;
  if (defi !== "pitch" && defi !== "tombola") notFound();
  return <AdminDefi type={defi} />;
}
