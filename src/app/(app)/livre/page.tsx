import type { Metadata } from "next";
import { Livre } from "@/components/traversee/livre/Livre";

export const metadata: Metadata = { title: "Livre d’or vidéo" };

export default function LivrePage() {
  return <Livre />;
}
