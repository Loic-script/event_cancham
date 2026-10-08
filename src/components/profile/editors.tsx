"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { EyeIcon, EyeOffIcon, ShieldCheckIcon } from "@/components/app/icons";
import { Avatar } from "@/components/app/Avatar";
import { fullName, participants, type Country } from "@/lib/mock/data";
import { updateProfile, type Profile } from "./useProfile";
import styles from "./profile.module.css";

export type SectionId = "name" | "bio" | "work" | "location" | "links" | "email" | "password" | "blocked";

type EditorProps = {
  profile: Profile;
  onSaved: (message: string) => void;
};

const field =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-[15px] text-graphite placeholder:text-graphite-faint " +
  "outline-none transition-[border-color,box-shadow] focus:border-palm focus:shadow-[0_0_0_4px_rgba(15,138,75,0.12)] aria-invalid:border-leaf";
const label = "mb-1.5 block text-[13px] font-semibold text-graphite";
const hint = "mt-1.5 text-[12.5px] leading-5 text-graphite-muted";
const primary =
  "flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-palm text-[15px] font-semibold text-white transition-[background-color,transform] hover:bg-palm-deep active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm focus-visible:ring-offset-2";

function Field({ id, children, text }: { id: string; children: ReactNode; text: string }) {
  return (
    <div>
      <label htmlFor={id} className={label}>{text}</label>
      {children}
    </div>
  );
}

/* ---------- nom ---------- */
export function NameEditor({ profile, onSaved }: EditorProps) {
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const a = useId();
  const b = useId();
  const dirty = firstName.trim() !== profile.firstName || lastName.trim() !== profile.lastName;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (firstName.trim().length < 2 || lastName.trim().length < 1) return;
    updateProfile({ firstName: firstName.trim(), lastName: lastName.trim() });
    onSaved("Nom mis à jour");
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={a} text="Prénom">
          <input id={a} value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" required minLength={2} className={field} />
        </Field>
        <Field id={b} text="Nom">
          <input id={b} value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" required className={field} />
        </Field>
      </div>
      <p className={hint}>C’est le nom que les autres participants verront sur votre billet, vos publications et vos messages.</p>
      <button type="submit" disabled={!dirty} className={primary}>Enregistrer le nom</button>
    </form>
  );
}

/* ---------- bio ---------- */
export function BioEditor({ profile, onSaved }: EditorProps) {
  const [bio, setBio] = useState(profile.bio ?? "");
  const id = useId();
  const max = 160;

  function submit(e: FormEvent) {
    e.preventDefault();
    updateProfile({ bio: bio.trim() });
    onSaved("Bio mise à jour");
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field id={id} text="Bio">
        <textarea id={id} value={bio} onChange={(e) => setBio(e.target.value.slice(0, max))} rows={4} placeholder="Ce que vous faites, ce que vous cherchez au gala…" className={`${field} resize-none`} />
        <p className={`${hint} text-right tabular-nums`}>{bio.length}/{max}</p>
      </Field>
      <button type="submit" disabled={bio.trim() === (profile.bio ?? "").trim()} className={primary}>Enregistrer la bio</button>
    </form>
  );
}

/* ---------- entreprise et poste ---------- */
const SECTORS = ["Agroalimentaire", "Artisanat", "Événementiel", "Finance", "Industrie", "Institutionnel", "Médias", "Mines", "Numérique", "Services", "Tourisme", "Autre"];

export function WorkEditor({ profile, onSaved }: EditorProps) {
  const [company, setCompany] = useState(profile.company);
  const [role, setRole] = useState(profile.role);
  const [sector, setSector] = useState(profile.sector);
  const a = useId();
  const b = useId();
  const c = useId();
  const dirty = company !== profile.company || role !== profile.role || sector !== profile.sector;

  function submit(e: FormEvent) {
    e.preventDefault();
    updateProfile({ company: company.trim(), role: role.trim(), sector });
    onSaved("Entreprise et poste mis à jour");
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field id={a} text="Entreprise">
        <input id={a} value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="organization" required className={field} />
      </Field>
      <Field id={b} text="Poste">
        <input id={b} value={role} onChange={(e) => setRole(e.target.value)} autoComplete="organization-title" required className={field} />
      </Field>
      <Field id={c} text="Secteur">
        <select id={c} value={SECTORS.includes(sector) ? sector : "Autre"} onChange={(e) => setSector(e.target.value)} className={field}>
          {SECTORS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <button type="submit" disabled={!dirty} className={primary}>Enregistrer</button>
    </form>
  );
}

/* ---------- ville et pays ---------- */
export function LocationEditor({ profile, onSaved }: EditorProps) {
  const [city, setCity] = useState(profile.city);
  const [country, setCountry] = useState<Country>(profile.country);
  const a = useId();
  const b = useId();
  const dirty = city !== profile.city || country !== profile.country;

  function submit(e: FormEvent) {
    e.preventDefault();
    updateProfile({ city: city.trim(), country });
    onSaved("Localisation mise à jour");
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field id={a} text="Ville">
        <input id={a} value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" required className={field} />
      </Field>
      <Field id={b} text="Pays">
        <select id={b} value={country} onChange={(e) => setCountry(e.target.value as Country)} className={field}>
          <option value="MG">Madagascar</option>
          <option value="CA">Canada</option>
        </select>
      </Field>
      <button type="submit" disabled={!dirty} className={primary}>Enregistrer</button>
    </form>
  );
}

/* ---------- site web et LinkedIn ---------- */
export function LinksEditor({ profile, onSaved }: EditorProps) {
  const [website, setWebsite] = useState(profile.website ?? "");
  const [linkedin, setLinkedin] = useState(profile.linkedin ?? "");
  const a = useId();
  const b = useId();
  const dirty = website !== (profile.website ?? "") || linkedin !== (profile.linkedin ?? "");

  function submit(e: FormEvent) {
    e.preventDefault();
    updateProfile({ website: website.trim().replace(/^https?:\/\//, ""), linkedin: linkedin.trim().replace(/^https?:\/\//, "") });
    onSaved("Liens mis à jour");
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field id={a} text="Site web">
        <input id={a} value={website} onChange={(e) => setWebsite(e.target.value)} inputMode="url" placeholder="votre-entreprise.mg" className={field} />
      </Field>
      <Field id={b} text="LinkedIn">
        <input id={b} value={linkedin} onChange={(e) => setLinkedin(e.target.value)} inputMode="url" placeholder="linkedin.com/in/votre-nom" className={field} />
      </Field>
      <p className={hint}>Ces liens apparaissent sur votre profil public pour faciliter la prise de contact.</p>
      <button type="submit" disabled={!dirty} className={primary}>Enregistrer les liens</button>
    </form>
  );
}

/* ---------- e-mail ---------- */
export function EmailEditor({ profile, onSaved }: EditorProps) {
  const [email, setEmail] = useState(profile.email);
  const id = useId();
  const valid = /^[^\s@]+@[^\s@]+$/.test(email.trim());

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    updateProfile({ email: email.trim() });
    onSaved("Adresse e-mail mise à jour");
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field id={id} text="Adresse e-mail">
        <input id={id} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" required className={field} />
        <p className={hint}>Elle sert à la connexion et aux rappels avant le gala. Un e-mail de confirmation sera envoyé à la nouvelle adresse.</p>
      </Field>
      <button type="submit" disabled={!valid || email.trim() === profile.email} className={primary}>Mettre à jour l’e-mail</button>
    </form>
  );
}

/* ---------- mot de passe ---------- */
function strength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH_LABEL = ["", "Faible", "Moyen", "Bon", "Excellent"];
const STRENGTH_COLOR = ["", "#ad0707", "#e0a020", "#007140", "#005a33"];

export function PasswordEditor({ onSaved }: EditorProps) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const a = useId();
  const b = useId();
  const c = useId();
  const score = strength(next);
  const ok = current.length > 0 && score >= 3 && next === confirm;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!ok) return;
    updateProfile({ passwordChangedAt: new Date().toISOString() });
    setCurrent("");
    setNext("");
    setConfirm("");
    onSaved("Mot de passe modifié");
  }

  const type = show ? "text" : "password";
  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field id={a} text="Mot de passe actuel">
        <input id={a} type={type} value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required className={field} />
      </Field>
      <Field id={b} text="Nouveau mot de passe">
        <div className="relative">
          <input id={b} type={type} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" required minLength={8} className={`${field} pr-12`} />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Masquer les mots de passe" : "Afficher les mots de passe"}
            aria-pressed={show}
            className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-graphite-faint hover:bg-paper hover:text-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm/60"
          >
            {show ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <span className={`${styles.meter} flex-1`} aria-hidden>
            {[1, 2, 3, 4].map((n) => <span key={n} style={{ background: n <= score ? STRENGTH_COLOR[score] : undefined }} />)}
          </span>
          <span className="w-16 text-right text-[12px] font-semibold" style={{ color: STRENGTH_COLOR[score] || "var(--graphite-faint)" }} aria-live="polite">
            {next ? STRENGTH_LABEL[score] || "Trop court" : ""}
          </span>
        </div>
        <p className={hint}>Huit caractères minimum, avec majuscules, minuscules, un chiffre et si possible un symbole.</p>
      </Field>
      <Field id={c} text="Confirmer le nouveau mot de passe">
        <input id={c} type={type} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required aria-invalid={confirm.length > 0 && confirm !== next ? true : undefined} className={field} />
        {confirm.length > 0 && confirm !== next ? <p className="mt-1.5 text-[12.5px] text-leaf-ink">Les deux mots de passe ne correspondent pas.</p> : null}
      </Field>
      <button type="submit" disabled={!ok} className={primary}>Changer le mot de passe</button>
    </form>
  );
}

/* ---------- utilisateurs bloqués ---------- */
export function BlockedEditor({ profile, onSaved }: EditorProps) {
  const blocked = profile.blocked.map((id) => participants.find((p) => p.id === id)).filter((p) => p !== undefined);

  function unblock(id: string) {
    updateProfile({ blocked: profile.blocked.filter((x) => x !== id) });
    onSaved("Utilisateur débloqué");
  }

  if (blocked.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-paper px-6 py-10 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-palm-soft text-palm-ink"><ShieldCheckIcon width={26} height={26} /></span>
        <p className="text-[15px] font-semibold text-graphite">Aucun utilisateur bloqué</p>
        <p className="max-w-xs text-[13.5px] leading-5 text-graphite-muted">Les personnes que vous bloquez ne peuvent plus vous écrire ni voir vos publications. Vous les retrouverez ici pour les débloquer.</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {blocked.map((p) => (
        <li key={p.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
          <Avatar person={p} size={40} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-semibold text-graphite">{fullName(p)}</span>
            <span className="block truncate text-[12.5px] text-graphite-muted">{p.company}</span>
          </span>
          <button type="button" onClick={() => unblock(p.id)} className="h-9 cursor-pointer rounded-lg border border-line px-3 text-[13px] font-semibold text-graphite hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm">
            Débloquer
          </button>
        </li>
      ))}
    </ul>
  );
}
