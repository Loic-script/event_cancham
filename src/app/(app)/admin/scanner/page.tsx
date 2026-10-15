import type { Metadata } from "next";
import { AdminScanner } from "@/components/traversee/admin/AdminScanner";

export const metadata: Metadata = { title: "Scanner QR · Back-office" };

export default function Page() {
  return <AdminScanner />;
}
