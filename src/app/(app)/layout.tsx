import { AppShell } from "@/components/app/AppShell";
import { RightPanel } from "@/components/app/RightPanel";
import { requireUser } from "@/lib/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requireUser();
  return <AppShell aside={<RightPanel />}>{children}</AppShell>;
}
