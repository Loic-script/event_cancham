import { requireUser } from "@/lib/session";

export default async function DiscoverLayout({ children }: LayoutProps<"/decouvrir">) {
  await requireUser();
  return children;
}
