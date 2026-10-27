import type { Metadata } from "next";
import { CreerMembre } from "@/components/traversee/annuaire/CreerMembre";

export const metadata: Metadata = { title: "Créer un compte · Back-office" };

export default function Page() {
  return <CreerMembre />;
}
