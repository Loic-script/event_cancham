import type { Metadata } from "next";
import { AdminCommandes } from "@/components/traversee/admin/AdminCommandes";

export const metadata: Metadata = { title: "Commandes · Back-office" };

export default function Page() {
  return <AdminCommandes />;
}
