"use client";

import Link from "next/link";
import { useActionState, useRef, useState, type FormEvent } from "react";
import { login, type LoginState } from "@/app/connexion/actions";
import { EyeIcon, EyeOffIcon, SpinnerIcon } from "@/components/app/icons";
import { BoutonsSociaux } from "./BoutonsSociaux";
import styles from "./auth.module.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialState: LoginState = { error: null };

type FieldErrors = { email?: string; password?: string };

function emailError(value: string) {
  if (!value.trim()) return "Renseignez votre adresse e-mail.";
  if (!EMAIL_PATTERN.test(value.trim())) return "Cette adresse e-mail n’est pas valide (exemple : nom@entreprise.mg).";
  return undefined;
}

export function LoginForm({ next, fournisseurs, erreurSociale }: { next: string; fournisseurs: { google: boolean; facebook: boolean }; erreurSociale: string | null }) {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [seenState, setSeenState] = useState(state);
  const [dismissed, setDismissed] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  if (seenState !== state) {
    setSeenState(state);
    setDismissed(false);
  }

  const serverError = dismissed ? null : (state.error ?? (seenState === initialState ? erreurSociale : null));

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    const found: FieldErrors = {
      email: emailError(email),
      password: password ? undefined : "Renseignez votre mot de passe.",
    };
    if (found.email || found.password) {
      e.preventDefault();
      setErrors(found);
      (found.email ? emailRef : passwordRef).current?.focus();
    }
  }

  return (
    <>
      <form className={styles.form} action={formAction} onSubmit={onSubmit} noValidate>
        <input type="hidden" name="next" value={next} />

        <div className={styles.field}>
          <label htmlFor="login-email" className={styles.label}>
            Adresse e-mail
          </label>
          <input
            ref={emailRef}
            id="login-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="nom@entreprise.mg"
            className={styles.input}
            value={email}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((v) => ({ ...v, email: undefined }));
              setDismissed(true);
            }}
            onBlur={() => {
              if (email.trim()) setErrors((v) => ({ ...v, email: emailError(email) }));
            }}
          />
          {errors.email ? (
            <p id="login-email-error" className={styles.fieldError}>
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label htmlFor="login-password" className={styles.label}>
              Mot de passe
            </label>
            <Link href={EMAIL_PATTERN.test(email.trim()) ? `/mot-de-passe-oublie?email=${encodeURIComponent(email.trim())}` : "/mot-de-passe-oublie"} className={styles.forgot}>
              Mot de passe oublié ?
            </Link>
          </div>
          <div className={styles.control}>
            <input
              ref={passwordRef}
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className={`${styles.input} ${styles.inputWithToggle}`}
              value={password}
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? "login-password-error" : undefined}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((v) => ({ ...v, password: undefined }));
                setDismissed(true);
              }}
            />
            <button
              type="button"
              className={styles.eye}
              onClick={() => setShowPassword((v) => !v)}
              aria-pressed={showPassword}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? <EyeIcon width={20} height={20} /> : <EyeOffIcon width={20} height={20} />}
            </button>
          </div>
          {errors.password ? (
            <p id="login-password-error" className={styles.fieldError}>
              {errors.password}
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
          {pending ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <p className={styles.or}>ou continuer avec</p>

      <BoutonsSociaux actifs={fournisseurs} depuis="connexion" next={next} />

      <p className={styles.switch}>
        Pas encore de compte ?{" "}
        <Link href="/inscription" className={styles.switchLink}>
          Créer un compte
        </Link>
      </p>
    </>
  );
}
