"use client";

import Link from "next/link";
import { useActionState, useRef, useState, type FormEvent } from "react";
import { choisirMotDePasse, demanderLien, type DemandeState, type NouveauMotDePasseState } from "@/app/mot-de-passe-oublie/actions";
import { EyeIcon, EyeOffIcon, SpinnerIcon } from "@/components/app/icons";
import { EMAIL_PATTERN, MIN_PASSWORD_LENGTH } from "@/lib/coordonnees";
import styles from "./auth.module.css";

const demandeInitiale: DemandeState = { error: null, envoyeA: null };
const choixInitial: NouveauMotDePasseState = { error: null };

function RetourConnexion() {
  return (
    <p className={styles.switch}>
      Vous vous en souvenez ?{" "}
      <Link href="/connexion" className={styles.switchLink}>
        Se connecter
      </Link>
    </p>
  );
}

export function DemandeLienForm({ emailInitial }: { emailInitial: string }) {
  const [state, formAction, pending] = useActionState(demanderLien, demandeInitiale);
  const [email, setEmail] = useState(emailInitial);
  const [erreur, setErreur] = useState<string | null>(null);
  const [seenState, setSeenState] = useState(state);
  const [dismissed, setDismissed] = useState(false);
  const champ = useRef<HTMLInputElement>(null);

  if (seenState !== state) {
    setSeenState(state);
    setDismissed(false);
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    const message = !email.trim() ? "Renseignez votre adresse e-mail." : EMAIL_PATTERN.test(email.trim()) ? null : "Cette adresse e-mail n’est pas valide (exemple : nom@entreprise.mg).";
    if (message) {
      e.preventDefault();
      setErreur(message);
      champ.current?.focus();
    }
  }

  if (state.envoyeA && !dismissed) {
    return (
      <>
        <div className={styles.attente}>
          <p role="status">
            Si un compte existe pour <strong>{state.envoyeA}</strong>, un e-mail vient de partir avec un lien pour choisir un nouveau mot de passe. Il est valable une heure.
          </p>
          <p className={styles.notice}>Rien reçu d’ici quelques minutes ? Regardez dans les courriers indésirables.</p>
          <button type="button" className={styles.secondaire} onClick={() => setDismissed(true)}>
            Utiliser une autre adresse
          </button>
        </div>
        <RetourConnexion />
      </>
    );
  }

  const serverError = dismissed ? null : state.error;

  return (
    <>
      <form className={styles.form} action={formAction} onSubmit={onSubmit} noValidate>
        <p className={styles.hint}>Saisissez l’adresse e-mail de votre compte : vous recevrez un lien pour choisir un nouveau mot de passe.</p>
        <div className={styles.field}>
          <label htmlFor="oubli-email" className={styles.label}>
            Adresse e-mail
          </label>
          <input
            ref={champ}
            id="oubli-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="nom@entreprise.mg"
            className={styles.input}
            value={email}
            aria-invalid={erreur ? true : undefined}
            aria-describedby={erreur ? "oubli-email-error" : undefined}
            onChange={(e) => {
              setEmail(e.target.value);
              setErreur(null);
              setDismissed(true);
            }}
          />
          {erreur ? (
            <p id="oubli-email-error" className={styles.fieldError}>
              {erreur}
            </p>
          ) : null}
        </div>

        {serverError ? (
          <p role="alert" className={styles.error}>
            {serverError}
          </p>
        ) : null}

        <button type="submit" className={styles.submit} disabled={pending} aria-busy={pending}>
          {pending ? <SpinnerIcon width={18} height={18} className={styles.spin} aria-hidden /> : null}
          {pending ? "Envoi…" : "Recevoir le lien"}
        </button>
      </form>
      <RetourConnexion />
    </>
  );
}

type Champ = "password" | "confirmation";

/** `creation` : premier mot de passe d'un compte créé par un administrateur (lien /creer-mot-de-passe/<jeton>). */
export function NouveauMotDePasseForm({ jeton, email, creation = false }: { jeton: string; email: string; creation?: boolean }) {
  const [state, formAction, pending] = useActionState(choisirMotDePasse, choixInitial);
  const [valeurs, setValeurs] = useState({ password: "", confirmation: "" });
  const [erreurs, setErreurs] = useState<Partial<Record<Champ, string>>>({});
  const [visible, setVisible] = useState(false);
  const [seenState, setSeenState] = useState(state);
  const [dismissed, setDismissed] = useState(false);

  if (seenState !== state) {
    setSeenState(state);
    setDismissed(false);
  }

  const serverError = dismissed ? null : state.error;

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    const trouve: Partial<Record<Champ, string>> = {
      password: valeurs.password.length >= MIN_PASSWORD_LENGTH ? undefined : `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`,
      confirmation: valeurs.confirmation === valeurs.password ? undefined : "Les deux mots de passe ne sont pas identiques.",
    };
    const premier = (["password", "confirmation"] as Champ[]).find((c) => trouve[c]);
    if (premier) {
      e.preventDefault();
      setErreurs(trouve);
      const input = e.currentTarget.elements.namedItem(premier);
      if (input instanceof HTMLInputElement) input.focus();
    }
  }

  function champ(nom: Champ, label: string, autoFocus = false) {
    const errorId = `nouveau-${nom}-error`;
    return (
      <div className={styles.field}>
        <label htmlFor={`nouveau-${nom}`} className={styles.label}>
          {label}
        </label>
        <div className={styles.control}>
          <input
            id={`nouveau-${nom}`}
            name={nom}
            type={visible ? "text" : "password"}
            autoComplete="new-password"
            autoFocus={autoFocus}
            className={`${styles.input} ${styles.inputWithToggle}`}
            value={valeurs[nom]}
            aria-invalid={erreurs[nom] ? true : undefined}
            aria-describedby={[erreurs[nom] ? errorId : "", nom === "password" ? "nouveau-password-hint" : ""].filter(Boolean).join(" ") || undefined}
            onChange={(e) => {
              const v = e.target.value;
              setValeurs((x) => ({ ...x, [nom]: v }));
              setErreurs((x) => ({ ...x, [nom]: undefined }));
              setDismissed(true);
            }}
          />
          <button
            type="button"
            className={styles.eye}
            onClick={() => setVisible((v) => !v)}
            aria-pressed={visible}
            aria-label={visible ? "Masquer les mots de passe" : "Afficher les mots de passe"}
          >
            {visible ? <EyeIcon width={20} height={20} /> : <EyeOffIcon width={20} height={20} />}
          </button>
        </div>
        {erreurs[nom] ? (
          <p id={errorId} className={styles.fieldError}>
            {erreurs[nom]}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form className={styles.form} action={formAction} onSubmit={onSubmit} noValidate>
      <input type="hidden" name="jeton" value={jeton} />
      <input type="text" name="username" autoComplete="username" value={email} readOnly hidden />
      <p className={styles.notice}>Compte : {email}</p>
      {champ("password", creation ? "Votre mot de passe" : "Nouveau mot de passe", true)}
      <p id="nouveau-password-hint" className={styles.hint}>
        {MIN_PASSWORD_LENGTH} caractères minimum.{creation ? "" : " Vos autres appareils seront déconnectés."}
      </p>
      {champ("confirmation", "Confirmez le mot de passe")}

      {serverError ? (
        <p role="alert" className={styles.error}>
          {serverError}{" "}
          {serverError.includes("plus valable") ? (
            <Link href="/mot-de-passe-oublie" className={styles.switchLink}>
              Demander un nouveau lien
            </Link>
          ) : null}
        </p>
      ) : null}

      <button type="submit" className={styles.submit} disabled={pending} aria-busy={pending}>
        {pending ? <SpinnerIcon width={18} height={18} className={styles.spin} aria-hidden /> : null}
        {pending ? "Enregistrement…" : creation ? "Créer mon mot de passe et entrer" : "Enregistrer et me connecter"}
      </button>
    </form>
  );
}
