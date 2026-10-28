import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { AuthScene } from "@/components/auth/AuthScene";
import { NouveauMotDePasseForm } from "@/components/auth/MotDePasseOublie";
import styles from "@/components/auth/auth.module.css";
import { lireJeton } from "@/lib/reinitialisation";

export const metadata: Metadata = {
  title: { absolute: "Créez votre mot de passe – La Traversée" },
  // Le jeton est dans l'adresse : elle ne doit pas partir vers d'autres sites.
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0f1d2c",
  viewportFit: "cover",
};

/** Premier mot de passe d'un compte créé par un administrateur (lien reçu par e-mail, valable 7 jours, usage unique). */
export default async function CreerMotDePassePage(props: PageProps<"/creer-mot-de-passe/[jeton]">) {
  const { jeton } = await props.params;
  const lien = await lireJeton(jeton);

  return (
    <AuthScene headline={{ first: "Bienvenue à", accent: "La Traversée." }} lead="Votre compte est prêt : choisissez un mot de passe que vous n’utilisez nulle part ailleurs." cardTitle={lien ? "Créez votre mot de passe" : "Lien expiré"} charte="cancham">
      {lien ? (
        <NouveauMotDePasseForm jeton={jeton} email={lien.email} creation />
      ) : (
        <div className={styles.attente}>
          <p>Ce lien n’est plus valable : il a déjà servi, ou il date de plus de 7 jours. « Mot de passe oublié ? » vous en enverra un nouveau à la même adresse.</p>
          <Link href="/mot-de-passe-oublie" className={styles.submit}>
            Recevoir un nouveau lien
          </Link>
          <Link href="/connexion" className={styles.secondaire}>
            Retour à la connexion
          </Link>
        </div>
      )}
    </AuthScene>
  );
}
