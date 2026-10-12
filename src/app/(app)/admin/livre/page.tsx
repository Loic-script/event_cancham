import type { Metadata } from "next";
import { AdminLivre } from "@/components/traversee/admin/AdminContenus";

export const metadata: Metadata = { title: "Livre d’or · Back-office" };

export default function Page() {
  return <AdminLivre />;
}
