import type { Metadata } from "next";
import { AdminProgramme } from "@/components/traversee/admin/AdminProgramme";
import { chargerProgrammeAdmin } from "@/lib/programme";

export const metadata: Metadata = { title: "Programme · Back-office" };

export default async function Page() {
  return <AdminProgramme items={await chargerProgrammeAdmin()} />;
}
