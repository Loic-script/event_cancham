import type { Metadata } from "next";
import { AdminPhotos } from "@/components/traversee/admin/AdminContenus";

export const metadata: Metadata = { title: "Photos et vidéos · Back-office" };

export default function Page() {
  return <AdminPhotos />;
}
