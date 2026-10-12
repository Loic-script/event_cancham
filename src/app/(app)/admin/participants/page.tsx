import type { Metadata } from "next";
import { AdminParticipants } from "@/components/traversee/admin/AdminParticipants";

export const metadata: Metadata = { title: "Participants · Back-office" };

export default function Page() {
  return <AdminParticipants />;
}
