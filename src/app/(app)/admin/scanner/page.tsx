import type { Metadata } from "next";
import { AdminScanner } from "@/components/traversee/admin/AdminScanner";
import { entreesGala, nombreInscrits } from "@/lib/billets";

export const metadata: Metadata = { title: "Scanner QR · Back-office" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const [entrees, inscrits] = await Promise.all([entreesGala(), nombreInscrits()]);
  return <AdminScanner entrees={entrees} inscrits={inscrits} />;
}
