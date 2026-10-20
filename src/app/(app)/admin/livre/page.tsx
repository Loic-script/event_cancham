import type { Metadata } from "next";
import { AdminLivre } from "@/components/traversee/admin/AdminContenus";
import { souvenirsAdmin } from "@/lib/livre";

export const metadata: Metadata = { title: "Livre d’or · Back-office" };
export const dynamic = "force-dynamic";

export default async function Page() {
  return <AdminLivre souvenirs={await souvenirsAdmin()} />;
}
