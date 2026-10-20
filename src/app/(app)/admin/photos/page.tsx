import type { Metadata } from "next";
import { AdminPhotos } from "@/components/traversee/admin/AdminContenus";
import { photosGalerie } from "@/lib/galerie";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Photos et vidéos · Back-office" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await requireAdmin();
  return <AdminPhotos photos={await photosGalerie(user.id)} />;
}
