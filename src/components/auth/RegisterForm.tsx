"use client";

import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";
import { register, type RegisterState } from "@/app/inscription/actions";
import { EyeIcon, EyeOffIcon, SpinnerIcon } from "@/components/app/icons";
import { BoutonsSociaux } from "./BoutonsSociaux";
import styles from "./auth.module.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[\d\s().-]{7,20}$/;
const MIN_PASSWORD_LENGTH = 8;

const initialState: RegisterState = { error: null };

const emptyFields = { lastName: "", firstName: "", company: "", role: "", email: "", phone: "", password: "" };

type FieldName = keyof typeof emptyFields;
type FieldErrors = Partial<Record<FieldName, string>>;

const ORDER: FieldName[] = ["lastName", "firstName", "company", "role", "email", "phone", "password"];

function validate(name: FieldName, value: string) {
  switch (name) {
    case "firstName":
      return value.trim() ? undefined : "Renseignez votre prénom.";
    case "lastName":
      return value.trim() ? undefined : "Renseignez votre nom.";
    case "company":
      return value.trim() ? undefined : "Renseignez le nom de votre entreprise.";
    case "role":
      return value.trim() ? undefined : "Renseignez votre rôle dans l’entreprise.";
    case "email":
      if (!value.trim()) return "Renseignez votre adresse e-mail.";
      return EMAIL_PATTERN.test(value.trim()) ? undefined : "Cette adresse e-mail n’est pas valide (exemple : nom@entreprise.mg).";
    case "phone":
      if (!value.trim()) return "Renseignez votre numéro de téléphone.";
      return PHONE_PATTERN.test(value.trim()) && value.replace(/\D/g, "").length >= 7
        ? undefined
        : "Ce numéro n’est pas valide (exemple : +261 34 00 000 00).";
    case "password":
      return value.length >= MIN_PASSWORD_LENGTH ? undefined : `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`;
    default:
      return undefined;
  }
}

export function RegisterForm({ next, fournisseurs, erreurSociale }: { next: string; fournisseurs: { google: boolean; facebook: boolean }; erreurSociale: string | null }) {
  const [state, formAction, pending] = useActionState(register, initialState);
  const [fields, setFields] = useState(emptyFields);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [seenState, setSeenState] = useState(state);
  const [dismissed, setDismissed] = useState(false);

  if (seenState !== state) {
    setSeenState(state);
    setDismissed(false);
  }

  const serverError = dismissed ? null : state.error;
  const [erreurSocialeVisible, setErreurSocialeVisible] = useState(erreurSociale);

  function inputProps(name: FieldName) {
    const errorId = `register-${name}-error`;
    return {
      id: `register-${name}`,
      name,
      value: fields[name],
      className: styles.input,
      "aria-invalid": errors[name] ? true : undefined,
      "aria-describedby": errors[name] ? errorId : undefined,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFields((f) => ({ ...f, [name]: value }));
        setErrors((v) => ({ ...v, [name]: undefined }));
        setDismissed(true);
      },
      onBlur: () => {
        if (fields[name]) setErrors((v) => ({ ...v, [name]: validate(name, fields[name]) }));
      },
    };
  }

  function fieldError(name: FieldName) {
    return errors[name] ? (
      <p id={`register-${name}-error`} className={styles.fieldError}>
        {errors[name]}
      </p>
    ) : null;
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    const found: FieldErrors = {};
    for (const name of ORDER) found[name] = validate(name, fields[name]);
    const first = ORDER.find((name) => found[name]);
    if (first) {
      e.preventDefault();
      setErrors(found);
      const input = e.currentTarget.elements.namedItem(first);
      if (input instanceof HTMLInputElement) input.focus();
    }
  }

  return (
    <>
      <div className={styles.socialEnTete}>
        {erreurSocialeVisible ? (
          <p role="alert" className={styles.error}>
            {erreurSocialeVisible}
          </p>
        ) : null}
        <BoutonsSociaux actifs={fournisseurs} depuis="inscription" next={next} />
      </div>
      <p className={styles.or}>ou avec votre adresse e-mail</p>

      <form className={`${styles.form} ${styles.formSuite}`} action={formAction} onSubmit={onSubmit} noValidate onChange={() => setErreurSocialeVisible(null)}>
        <input type="hidden" name="next" value={next} />

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="register-lastName" className={styles.label}>
              Nom
            </label>
            <input type="text" autoComplete="family-name" maxLength={60} {...inputProps("lastName")} />
            {fieldError("lastName")}
          </div>
          <div className={styles.field}>
            <label htmlFor="register-firstName" className={styles.label}>
              Prénom
            </label>
            <input type="text" autoComplete="given-name" maxLength={60} {...inputProps("firstName")} />
            {fieldError("firstName")}
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="register-company" className={styles.label}>
              Entreprise
            </label>
            <input type="text" autoComplete="organization" maxLength={80} {...inputProps("company")} />
            {fieldError("company")}
          </div>
          <div className={styles.field}>
            <label htmlFor="register-role" className={styles.label}>
              Rôle
            </label>
            <input type="text" autoComplete="organization-title" maxLength={80} placeholder="Gérante" {...inputProps("role")} />
            {fieldError("role")}
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="register-email" className={styles.label}>
            Adresse e-mail
          </label>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="nom@entreprise.mg"
            {...inputProps("email")}
          />
          {fieldError("email")}
        </div>

        <div className={styles.field}>
          <label htmlFor="register-phone" className={styles.label}>
            Téléphone
          </label>
          <input type="tel" inputMode="tel" autoComplete="tel" maxLength={30} placeholder="+261 34 00 000 00" {...inputProps("phone")} />
          {fieldError("phone")}
        </div>

        <div className={styles.field}>
          <label htmlFor="register-password" className={styles.label}>
            Mot de passe
          </label>
          <div className={styles.control}>
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              {...inputProps("password")}
              className={`${styles.input} ${styles.inputWithToggle}`}
              aria-describedby={errors.password ? "register-password-error register-password-hint" : "register-password-hint"}
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
          {fieldError("password")}
          <p id="register-password-hint" className={styles.hint}>
            {MIN_PASSWORD_LENGTH} caractères minimum.
          </p>
        </div>

        {serverError ? (
          <p role="alert" className={styles.error}>
            {serverError}
          </p>
        ) : null}

        <button type="submit" className={styles.submit} disabled={pending} aria-busy={pending}>
          {pending ? <SpinnerIcon width={18} height={18} className={styles.spin} /> : null}
          {pending ? "Création du compte…" : "Créer mon compte"}
        </button>
      </form>

      <p className={styles.switch}>
        Déjà inscrit ?{" "}
        <Link href="/connexion" className={styles.switchLink}>
          Se connecter
        </Link>
      </p>
    </>
  );
}
