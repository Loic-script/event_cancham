import { AppShell } from "@/components/app/AppShell";
import { RightPanel } from "@/components/app/RightPanel";

// Toutes les pages de l'espace participant partagent la même coquille :
// barre d'onglets sur mobile, barre latérale et colonne de droite sur ordinateur.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return <AppShell aside={<RightPanel />}>{children}</AppShell>;
}
