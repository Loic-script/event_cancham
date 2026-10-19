import type { Metadata } from "next";
import { AdminCompte } from "@/components/traversee/admin/AdminCompte";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Mon compte · Back-office" };

export default async function Page() {
  const moi = await requireAdmin();
  return <AdminCompte compte={{ firstName: moi.firstName, lastName: moi.lastName, email: moi.email, depuis: moi.createdAt.toISOString() }} />;
}
