import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/connexion/actions";
import { AuthScene } from "@/components/auth/AuthScene";
import styles from "@/components/auth/auth.module.css";
import { LOGIN_PATH } from "@/lib/auth";
import { PAGE_COMPLETER } from "@/lib/connexion-sociale";
import { profilIncomplet } from "@/lib/coordonnees";
import { aAccesEspace, getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: { absolute: "Inscription en cours de validation – La Traversée" },
};

export const viewport: Viewport = {
  themeColor: "#0b1a30",
  viewportFit: "cover",
};

/** Page des comptes qui n'ont pas (encore) accès à l'espace participant. */
export default async function EnAttentePage() {
  const user = await getCurrentUser();
  if (!user) redirect(LOGIN_PATH);
  if (aAccesEspace(user)) redirect("/");
  if (user.statut === "EN_ATTENTE" && profilIncomplet(user)) redirect(PAGE_COMPLETER);

  const refuse = user.statut === "REFUSE";

  return (
    <AuthScene
      headline={refuse ? { first: "Merci pour", accent: "votre intérêt." } : { first: "Bienvenue,", accent: `${user.firstName}.` }}
      lead={refuse ? "Le gala des 10 ans, vendredi 18 décembre 2026." : "Votre place à La Traversée se prépare."}
      cardTitle={refuse ? "Accès non accordé" : "Inscription en cours de validation"}
    >
      <div className={styles.attente}>
        {refuse ? (
          <p>
            Votre demande d’accès à l’espace participant n’a pas été acceptée. Si vous pensez qu’il s’agit d’une erreur, contactez l’équipe
            organisatrice.
          </p>
        ) : (
          <>
            <p>
              Merci, votre compte est bien créé. L’équipe vérifie votre inscription : vous entrerez dans l’espace participant dès qu’elle sera
              validée.
            </p>
            <p className={styles.notice}>Compte : {user.email}</p>
            <Link href="/" className={styles.submit}>
              Vérifier mon accès
            </Link>
          </>
        )}
        <form action={logout}>
          <button type="submit" className={styles.secondaire}>
            Se déconnecter
          </button>
        </form>
      </div>
    </AuthScene>
  );
}
