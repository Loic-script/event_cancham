import type { Metadata } from "next";
import { AdminAccueil } from "@/components/traversee/admin/AdminAccueil";

export const metadata: Metadata = { title: "Back-office" };

export default function AdminPage() {
  return <AdminAccueil />;
}
