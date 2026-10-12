import type { Metadata } from "next";
import { AdminAnnonces } from "@/components/traversee/admin/AdminAnnonces";

export const metadata: Metadata = { title: "Annonces · Back-office" };

export default function Page() {
  return <AdminAnnonces />;
}
