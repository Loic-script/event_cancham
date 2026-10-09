import { AppShell } from "@/components/app/AppShell";
import { RightPanel } from "@/components/app/RightPanel";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return <AppShell aside={<RightPanel />}>{children}</AppShell>;
}
