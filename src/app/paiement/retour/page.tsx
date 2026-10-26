import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { CheckIcon, ClockIcon, XIcon } from "@/components/app/icons";
import { AuthScene } from "@/components/auth/AuthScene";
import auth from "@/components/auth/auth.module.css";
import styles from "@/components/paiement/paiement.module.css";
import { LOGIN_PATH } from "@/lib/auth";
import { etatParcours, PAGE_PARCOURS } from "@/lib/parcours";
import { formatAriary, MODES, prevenirPaiementReussi, referenceValide, tentativeDuMembre, verifierAuRetour, type ModePaiement } from "@/lib/paiements";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: { absolute: "Retour de paiement – La Traversée" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0b1a30",
  viewportFit: "cover",
};

export const dynamic = "force-dynamic";

/** Retour du payeur (redirect_url). Si la notification n'est pas encore arrivée, l'état est vérifié chez Vanilla Pay. */
export default async function RetourPaiementPage(props: PageProps<"/paiement/retour">) {
  const user = await getCurrentUser();
  if (!user) redirect(LOGIN_PATH);
  const { ref } = await props.searchParams;
  const reference = Array.isArray(ref) ? ref[0] : ref;
  // Seules les tentatives du membre connecté sont visibles.
  const tentative = referenceValide(reference) ? await tentativeDuMembre(user.id, reference) : null;
  if (!tentative) redirect("/paiement");

  const conclusion = await verifierAuRetour(tentative);
  if (conclusion === "reussi") after(() => prevenirPaiementReussi(tentative.reference));
  const reussi = conclusion === "reussi" || (conclusion === "deja" && tentative.statut === "reussi");
  const echoue = conclusion === "echoue" || conclusion === "montant";
  const moyen = MODES[tentative.mode as ModePaiement]?.libelle ?? tentative.mode;
  // Après le billet : le parcours de profil (photo, entreprise), sauf s'il est déjà terminé.
  const suite = reussi && !(await etatParcours(user.id)).termine ? PAGE_PARCOURS : "/";

  return (
    <AuthScene headline={reussi ? { first: "Bienvenue à", accent: "La Traversée." } : { first: "Votre billet,", prefix: "votre ", accent: "accès." }} lead={reussi ? "Votre place est réservée pour le 18 décembre." : "Un seul billet : la journée, le Gala, les deux défis et la plateforme."} cardTitle={reussi ? "Paiement reçu" : echoue ? "Paiement refusé" : "Confirmation en cours"}>
      <div className={styles.retour}>
        {reussi ? (
          <>
            <p className={`${styles.etat} ${styles.etatOk}`}>
              <CheckIcon width={20} height={20} strokeWidth={2.6} />
              Paiement reçu, votre accès est ouvert.
            </p>
            <p>
              Référence {tentative.reference} · {formatAriary(tentative.montant)} par {moyen}. Un reçu vous est envoyé par e-mail. Votre billet et son QR code sont dans votre profil.
            </p>
            <Link href={suite} className={auth.submit}>
              {suite === PAGE_PARCOURS ? "Compléter mon profil" : "Entrer dans la plateforme"}
            </Link>
          </>
        ) : echoue ? (
          <>
            <p className={`${styles.etat} ${styles.etatKo}`}>
              <XIcon width={20} height={20} strokeWidth={2.6} />
              Paiement refusé, rien n’a été débité.
            </p>
            <p>Référence {tentative.reference}. Vous pouvez réessayer, ou choisir un autre moyen de paiement.</p>
            <Link href="/paiement" className={auth.submit}>
              Réessayer
            </Link>
          </>
        ) : (
          <>
            <p className={`${styles.etat} ${styles.etatAttente}`}>
              <ClockIcon width={20} height={20} />
              Confirmation en cours.
            </p>
            <p>Le prestataire n’a pas encore confirmé votre paiement (référence {tentative.reference}). Rechargez cette page dans quelques minutes : dès la confirmation, votre accès s’ouvre.</p>
            <Link href={`/paiement/retour?ref=${tentative.reference}`} className={auth.submit}>
              Recharger
            </Link>
            <Link href="/paiement" className={auth.forgot}>
              Choisir un autre moyen
            </Link>
          </>
        )}
      </div>
    </AuthScene>
  );
}
