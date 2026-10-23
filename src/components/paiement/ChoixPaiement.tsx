"use client";

import Image from "next/image";
import { useActionState } from "react";
import { logout } from "@/app/connexion/actions";
import { payer, type PaiementState } from "@/app/paiement/actions";
import { ChevronRightIcon, SpinnerIcon } from "@/components/app/icons";
import auth from "@/components/auth/auth.module.css";
import type { ModePaiement } from "@/lib/paiements";
import styles from "./paiement.module.css";

/** Logos des moyens de paiement (public/paiement/, fournis par la CanCham). */
const MOYENS: { mode: ModePaiement; libelle: string; detail: string; logo: string; largeur: number; hauteur: number }[] = [
  { mode: "carte", libelle: "Carte bancaire", detail: "Visa, Mastercard, CB", logo: "/paiement/carte.jpg", largeur: 400, hauteur: 197 },
  { mode: "mvola", libelle: "MVola", detail: "Telma", logo: "/paiement/mvola.png", largeur: 400, hauteur: 182 },
  { mode: "orange_money", libelle: "Orange Money", detail: "Orange", logo: "/paiement/orange-money.png", largeur: 400, hauteur: 163 },
  { mode: "airtel_money", libelle: "Airtel Money", detail: "Airtel", logo: "/paiement/airtel-money.png", largeur: 400, hauteur: 176 },
];

const initial: PaiementState = { error: null };

type Props = {
  /** Montant déjà mis en forme (« 500 000 Ar »). */
  montant: string;
  courrielEquipe: string | null;
  /** Message à afficher en arrivant (paiement refusé, par exemple). */
  message?: string | null;
};

/** Page /paiement : le montant, ce qu'il débloque, les quatre moyens ; au clic, départ chez Vanilla Pay. */
export function ChoixPaiement({ montant, courrielEquipe, message = null }: Props) {
  const [state, action, pending] = useActionState(payer, initial);

  return (
    <div className={styles.bloc}>
      <div className={styles.montant}>
        <span className={styles.montantSur}>Billet La Traversée</span>
        <strong>{montant}</strong>
        <span className={styles.montantSous}>par personne · vendredi 18 décembre 2026</span>
      </div>
      <ul className={styles.debloque} aria-label="Ce que le billet débloque">
        <li>La journée : expositions, panels, réseautage 5 à 7</li>
        <li>Le Gala des 10 ans</li>
        <li>Les deux défis : voyage au Canada et 3 000 000 Ar</li>
        <li>La plateforme : annuaire, rendez-vous B2B, messagerie</li>
      </ul>

      {message ? <p className={auth.notice}>{message}</p> : null}
      {state.error ? (
        <p role="alert" className={auth.error}>
          {state.error}
        </p>
      ) : null}

      <form action={action} className={styles.moyens} aria-label="Moyen de paiement">
        {MOYENS.map((m) => (
          <button key={m.mode} type="submit" name="mode" value={m.mode} className={styles.moyen} disabled={pending} aria-busy={pending}>
            <span className={styles.logo}>
              <Image src={m.logo} alt="" width={m.largeur} height={m.hauteur} sizes="120px" />
            </span>
            <span className={styles.moyenTexte}>
              <strong>{m.libelle}</strong>
              <small>{m.detail}</small>
            </span>
            {pending ? <SpinnerIcon width={18} height={18} className={auth.spin} /> : <ChevronRightIcon width={18} height={18} className={styles.chevron} />}
          </button>
        ))}
      </form>
      <p className={styles.frais}>Les frais de l’opérateur ou de change s’ajoutent au montant. Le paiement se fait sur la page sécurisée de Vanilla Pay ; rien n’est débité tant qu’il n’est pas confirmé.</p>

      <div className={styles.liens}>
        {courrielEquipe ? (
          <a href={`mailto:${courrielEquipe}?subject=${encodeURIComponent("Billet La Traversée")}`} className={auth.forgot}>
            Écrire à l’équipe
          </a>
        ) : null}
        <form action={logout}>
          <button type="submit" className={auth.forgot}>
            Se déconnecter
          </button>
        </form>
      </div>
    </div>
  );
}
