import type { Metadata } from "next";
import { AdminAnnonces } from "@/components/traversee/admin/AdminAnnonces";
import { annoncesAdmin } from "@/lib/annonces";

export const metadata: Metadata = { title: "Annonces · Back-office" };
export const dynamic = "force-dynamic";

export default async function Page() {
  return <AdminAnnonces annonces={await annoncesAdmin()} />;
}
