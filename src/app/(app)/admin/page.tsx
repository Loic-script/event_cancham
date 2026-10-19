import type { Metadata } from "next";
import { AdminAccueil } from "@/components/traversee/admin/AdminAccueil";
import { chargerFil } from "@/lib/fil";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Back-office" };

export default async function AdminPage() {
  const user = await requireAdmin();
  return <AdminAccueil fil={await chargerFil(user.id)} />;
}
