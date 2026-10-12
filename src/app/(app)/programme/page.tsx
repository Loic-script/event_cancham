import type { Metadata } from "next";
import { Programme } from "@/components/traversee/programme/Programme";

export const metadata: Metadata = { title: "Programme" };

export default function ProgrammePage() {
  return <Programme />;
}
