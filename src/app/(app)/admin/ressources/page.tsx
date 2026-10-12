import type { Metadata } from "next";
import { AdminRessources } from "@/components/traversee/admin/AdminContenus";

export const metadata: Metadata = { title: "Ressources · Back-office" };

export default function Page() {
  return <AdminRessources />;
}
