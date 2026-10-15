import type { Metadata } from "next";
import { PlanSalle } from "@/components/traversee/place/PlanSalle";

export const metadata: Metadata = { title: "Ma place" };

export default function PlacePage() {
  return <PlanSalle />;
}
