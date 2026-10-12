import type { Metadata } from "next";
import { Profil } from "@/components/traversee/profil/Profil";

export const metadata: Metadata = { title: "Profil" };

export default function ProfilPage() {
  return <Profil />;
}
