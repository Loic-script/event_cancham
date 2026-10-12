import type { Metadata } from "next";
import { Achats } from "@/components/traversee/achats/Achats";

export const metadata: Metadata = { title: "Achats" };

export default function AchatsPage() {
  return <Achats />;
}
