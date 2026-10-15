import type { Metadata } from "next";
import { AdminProgramme } from "@/components/traversee/admin/AdminProgramme";

export const metadata: Metadata = { title: "Programme · Back-office" };

export default function Page() {
  return <AdminProgramme />;
}
