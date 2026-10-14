import { LockIcon, MailIcon, ShieldCheckIcon } from "@/components/app/icons";
import { Btn } from "@/components/traversee/ui";
import styles from "./bibliotheque.module.css";

export function AccesRequis({ type, suite, nom }: { type: "connexion" | "cotisation" | "equipe"; suite?: string; nom?: string }) {
  if (type === "connexion") {
    return (
      <div className={styles.alerte}>
        <LockIcon />
        <h1>Bibliothèque réservée aux membres</h1>
        <p>Connectez-vous avec le compte de votre entreprise membre pour lire les guides, modèles, formations et rapports de la CanCham.</p>
        <Btn variant="primary" href={`/connexion?suite=${encodeURIComponent(suite ?? "/ressources")}`}>
          Se connecter
        </Btn>
      </div>
    );
  }
  if (type === "equipe") {
    return (
      <div className={styles.alerte}>
        <ShieldCheckIcon />
        <h1>Espace réservé à l’équipe CanCham</h1>
        <p>{nom ? `${nom}, votre compte n’a pas les droits de l’équipe.` : "Connectez-vous avec un compte de l’équipe CanCham pour gérer la bibliothèque."}</p>
        <Btn variant="primary" href={`/connexion?suite=${encodeURIComponent(suite ?? "/admin/ressources")}`}>
          Changer de compte
        </Btn>
      </div>
    );
  }
  return (
    <div className={styles.alerte}>
      <LockIcon />
      <h1>Accès réservé aux membres à jour de cotisation</h1>
      <p>{nom ? `${nom}, la` : "La"} cotisation de votre entreprise n’est pas à jour. Renouvelez-la pour retrouver l’accès à la bibliothèque.</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Btn variant="navy" href="/messages/c1">
          <MailIcon width={16} height={16} />
          Écrire à l’équipe
        </Btn>
        <Btn href="/connexion">Changer de compte</Btn>
      </div>
    </div>
  );
}
