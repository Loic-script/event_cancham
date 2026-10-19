import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { AuthScene } from "@/components/auth/AuthScene";
import { NouveauMotDePasseForm } from "@/components/auth/MotDePasseOublie";
import styles from "@/components/auth/auth.module.css";
import { lireJeton } from "@/lib/reinitialisation";

export const metadata: Metadata = {
  title: { absolute: "Nouveau mot de passe – La Traversée" },
  // Le jeton est dans l'adresse : elle ne doit pas partir vers d'autres sites.
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0b1a30",
  viewportFit: "cover",
};

export default async function NouveauMotDePassePage(props: PageProps<"/mot-de-passe-oublie/[jeton]">) {
  const { jeton } = await props.params;
  const lien = await lireJeton(jeton);

  return (
    <AuthScene headline={{ first: "Retrouvez", accent: "votre accès." }} lead="Choisissez un mot de passe que vous n’utilisez nulle part ailleurs." cardTitle={lien ? "Nouveau mot de passe" : "Lien expiré"}>
      {lien ? (
        <NouveauMotDePasseForm jeton={jeton} email={lien.email} />
      ) : (
        <div className={styles.attente}>
          <p>Ce lien n’est plus valable : il a déjà servi, ou il date de plus d’une heure.</p>
          <Link href="/mot-de-passe-oublie" className={styles.submit}>
            Demander un nouveau lien
          </Link>
          <Link href="/connexion" className={styles.secondaire}>
            Retour à la connexion
          </Link>
        </div>
      )}
    </AuthScene>
  );
}
