import type { Metadata } from "next";
import { Profil } from "@/components/traversee/profil/Profil";
import { event } from "@/lib/mock/data";

export const metadata: Metadata = { title: "Profil" };
export const dynamic = "force-dynamic";

export default function ProfilPage() {
  const now = new Date();
  const restant = Math.max(0, Math.floor((new Date(event.date).getTime() - now.getTime()) / 1000));
  return <Profil restant={restant} />;
}
