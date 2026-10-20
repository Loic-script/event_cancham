import type { Metadata } from "next";
import { AdminAccueil } from "@/components/traversee/admin/AdminAccueil";
import { chargerFil } from "@/lib/fil";
import { promotions, storiesAccueil } from "@/lib/galerie";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Back-office" };

export default async function AdminPage() {
  const user = await requireAdmin();
  const [fil, stories, promos] = await Promise.all([chargerFil(user.id), storiesAccueil(), promotions()]);
  return <AdminAccueil fil={fil} stories={stories} promos={promos} />;
}
