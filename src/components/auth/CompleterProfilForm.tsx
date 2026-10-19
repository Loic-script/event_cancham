"use client";

import { useActionState, useState, type FormEvent } from "react";
import { logout } from "@/app/connexion/actions";
import { completerProfil, type CompleterState } from "@/app/inscription/completer/actions";
import { SpinnerIcon } from "@/components/app/icons";
import { PHONE_PATTERN, type Coordonnees } from "@/lib/coordonnees";
import styles from "./auth.module.css";

const initialState: CompleterState = { error: null };

type Nom = keyof Coordonnees;
const ORDRE: Nom[] = ["lastName", "firstName", "company", "role", "phone"];

function valider(nom: Nom, v: string) {
  if (!v.trim()) return { lastName: "Renseignez votre nom.", firstName: "Renseignez votre prénom.", company: "Renseignez le nom de votre entreprise.", role: "Renseignez votre rôle dans l’entreprise.", phone: "Renseignez votre numéro de téléphone." }[nom];
  if (nom === "phone" && (!PHONE_PATTERN.test(v.trim()) || v.replace(/\D/g, "").length < 7)) return "Ce numéro n’est pas valide (exemple : +261 34 00 000 00).";
  return undefined;
}

export function CompleterProfilForm({ email, initial }: { email: string; initial: Coordonnees }) {
  const [state, formAction, pending] = useActionState(completerProfil, initialState);
  const [champs, setChamps] = useState(initial);
  const [erreurs, setErreurs] = useState<Partial<Record<Nom, string>>>({});
  const [seenState, setSeenState] = useState(state);
  const [dismissed, setDismissed] = useState(false);

  if (seenState !== state) {
    setSeenState(state);
    setDismissed(false);
  }

  const serverError = dismissed ? null : state.error;

  function props(nom: Nom) {
    return {
      id: `profil-${nom}`,
      name: nom,
      value: champs[nom],
      className: styles.input,
      "aria-invalid": erreurs[nom] ? true : undefined,
      "aria-describedby": erreurs[nom] ? `profil-${nom}-error` : undefined,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        setChamps((c) => ({ ...c, [nom]: v }));
        setErreurs((x) => ({ ...x, [nom]: undefined }));
        setDismissed(true);
      },
    };
  }

  function erreur(nom: Nom) {
    return erreurs[nom] ? (
      <p id={`profil-${nom}-error`} className={styles.fieldError}>
        {erreurs[nom]}
      </p>
    ) : null;
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    const trouve: Partial<Record<Nom, string>> = {};
    for (const nom of ORDRE) trouve[nom] = valider(nom, champs[nom]);
    const premier = ORDRE.find((nom) => trouve[nom]);
    if (premier) {
      e.preventDefault();
      setErreurs(trouve);
      const input = e.currentTarget.elements.namedItem(premier);
      if (input instanceof HTMLInputElement) input.focus();
    }
  }

  return (
    <>
      <form className={styles.form} action={formAction} onSubmit={onSubmit} noValidate>
        <p className={styles.notice}>Compte : {email}</p>
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="profil-lastName" className={styles.label}>
              Nom
            </label>
            <input type="text" autoComplete="family-name" maxLength={60} {...props("lastName")} />
            {erreur("lastName")}
          </div>
          <div className={styles.field}>
            <label htmlFor="profil-firstName" className={styles.label}>
              Prénom
            </label>
            <input type="text" autoComplete="given-name" maxLength={60} {...props("firstName")} />
            {erreur("firstName")}
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="profil-company" className={styles.label}>
              Entreprise
            </label>
            <input type="text" autoComplete="organization" maxLength={80} {...props("company")} />
            {erreur("company")}
          </div>
          <div className={styles.field}>
            <label htmlFor="profil-role" className={styles.label}>
              Rôle
            </label>
            <input type="text" autoComplete="organization-title" maxLength={80} placeholder="Gérante" {...props("role")} />
            {erreur("role")}
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor="profil-phone" className={styles.label}>
            Téléphone
          </label>
          <input type="tel" inputMode="tel" autoComplete="tel" maxLength={30} placeholder="+261 34 00 000 00" {...props("phone")} />
          {erreur("phone")}
        </div>

        {serverError ? (
          <p role="alert" className={styles.error}>
            {serverError}
          </p>
        ) : null}

        <button type="submit" className={styles.submit} disabled={pending} aria-busy={pending}>
          {pending ? <SpinnerIcon width={18} height={18} className={styles.spin} aria-hidden /> : null}
          {pending ? "Enregistrement…" : "Terminer mon inscription"}
        </button>
      </form>
      <form action={logout} className={styles.switch}>
        Ce n’est pas vous ?{" "}
        <button type="submit" className={styles.switchLink}>
          Se déconnecter
        </button>
      </form>
    </>
  );
}
