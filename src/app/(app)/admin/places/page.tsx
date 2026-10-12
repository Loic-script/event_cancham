import type { Metadata } from "next";
import { AdminPlaces } from "@/components/traversee/admin/AdminPlaces";

export const metadata: Metadata = { title: "Places · Back-office" };

export default function Page() {
  return <AdminPlaces />;
}
