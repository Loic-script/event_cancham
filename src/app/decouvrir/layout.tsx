import { requireMembreActif } from "@/lib/session";

export default async function DiscoverLayout({ children }: LayoutProps<"/decouvrir">) {
  await requireMembreActif();
  return children;
}
