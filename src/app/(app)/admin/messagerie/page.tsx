import type { Metadata } from "next";
import { AdminMessagerie } from "@/components/traversee/admin/AdminMessagerie";

export const metadata: Metadata = { title: "Messagerie · Back-office" };

export default function Page() {
  return <AdminMessagerie />;
}
