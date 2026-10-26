import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { AuthScene } from "@/components/auth/AuthScene";
import { ChoixPaiement } from "@/components/paiement/ChoixPaiement";
import { LOGIN_PATH } from "@/lib/auth";
import { PAGE_COMPLETER, profilIncomplet } from "@/lib/coordonnees";
import { formatAriary, montantBillet } from "@/lib/paiements";
import { aAccesEspace, getCurrentUser, PAGE_ATTENTE } from "@/lib/session";

export const metadata: Metadata = {
  title: { absolute: "Régler mon billet – La Traversée" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0b1a30",
  viewportFit: "cover",
};

export const dynamic = "force-dynamic";

const MESSAGES: Record<string, string> = {
  refus: "Le paiement a été refusé, rien n’a été débité. Vous pouvez réessayer ou choisir un autre moyen.",
};

/** Règlement du billet : juste après l'inscription, avant le parcours d'accueil, tant que l'accès n'est pas ouvert. */
export default async function PaiementPage(props: PageProps<"/paiement">) {
  const user = await getCurrentUser();
  if (!user) redirect(LOGIN_PATH);
  if (aAccesEspace(user)) redirect("/");
  if (user.statut !== "EN_ATTENTE") redirect(PAGE_ATTENTE);
  if (profilIncomplet(user)) redirect(PAGE_COMPLETER);

  const { message } = await props.searchParams;
  const cle = Array.isArray(message) ? message[0] : message;

  return (
    <AuthScene headline={{ first: "Votre billet,", prefix: "votre ", accent: "accès." }} lead="Un seul billet : la journée, le Gala, les deux défis et la plateforme." cardTitle="Régler mon billet">
      <ChoixPaiement montant={formatAriary(montantBillet())} courrielEquipe={process.env.COURRIEL_EQUIPE?.trim() || null} message={cle ? (MESSAGES[cle] ?? null) : null} />
    </AuthScene>
  );
}
