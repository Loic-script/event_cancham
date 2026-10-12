import type { Metadata } from "next";
import { Accueil } from "@/components/traversee/accueil/Accueil";
import { event } from "@/lib/mock/data";

export const metadata: Metadata = { title: "Accueil" };
export const dynamic = "force-dynamic";

export default function HomePage() {
  const now = new Date();
  const restant = Math.max(0, Math.floor((new Date(event.date).getTime() - now.getTime()) / 1000));
  return <Accueil restant={restant} />;
}
