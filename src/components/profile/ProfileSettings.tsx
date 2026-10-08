"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Avatar } from "@/components/app/Avatar";
import {
  BriefcaseIcon,
  CameraIcon,
  CheckIcon,
  LinkIcon,
  LockIcon,
  LogOutIcon,
  MailIcon,
  MapPinIcon,
  PencilIcon,
  ShieldCheckIcon,
  UserIcon,
  XIcon,
  type IconProps,
} from "@/components/app/icons";
import { shrinkImage } from "@/components/challenges/useParticipation";
import { countryLabel, fullName } from "@/lib/mock/data";
import {
  BioEditor,
  BlockedEditor,
  EmailEditor,
  LinksEditor,
  LocationEditor,
  NameEditor,
  PasswordEditor,
  WorkEditor,
  type SectionId,
} from "./editors";
import { updateProfile, useProfile, type Profile } from "./useProfile";
import styles from "./profile.module.css";

type Section = {
  id: SectionId;
  label: string;
  title: string;
  icon: (p: IconProps) => React.JSX.Element;
  value: (p: Profile) => string | null;
};

const SECTIONS: Section[] = [
  { id: "name", label: "Votre nom", title: "Modifier votre nom", icon: UserIcon, value: (p) => fullName(p) },
  { id: "bio", label: "Bio", title: "Modifier votre bio", icon: PencilIcon, value: (p) => p.bio?.trim() || null },
  { id: "work", label: "Entreprise et poste", title: "Entreprise et poste", icon: BriefcaseIcon, value: (p) => `${p.company} · ${p.role}` },
  { id: "location", label: "Ville et pays", title: "Ville et pays", icon: MapPinIcon, value: (p) => `${p.city}, ${countryLabel[p.country]}` },
  { id: "links", label: "Site web et LinkedIn", title: "Site web et LinkedIn", icon: LinkIcon, value: (p) => p.website?.trim() || p.linkedin?.trim() || null },
  { id: "email", label: "Adresse e-mail", title: "Modifier votre adresse e-mail", icon: MailIcon, value: (p) => p.email },
  { id: "password", label: "Mot de passe", title: "Changer le mot de passe", icon: LockIcon, value: (p) => (p.passwordChangedAt ? "Modifié récemment" : "••••••••") },
  { id: "blocked", label: "Utilisateurs bloqués", title: "Utilisateurs bloqués", icon: ShieldCheckIcon, value: (p) => (p.blocked.length ? `${p.blocked.length} bloqué${p.blocked.length > 1 ? "s" : ""}` : null) },
];

const EMPTY_LABEL: Partial<Record<SectionId, string>> = {
  bio: "Aucune bio renseignée",
  links: "Aucun lien renseigné",
  blocked: "Aucun utilisateur bloqué",
};

const memberSince = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

type ProfileSettingsProps = {
  /** Sections affichées sous le panneau sur ordinateur et sous la liste sur mobile. */
  extra?: ReactNode;
};

export function ProfileSettings({ extra }: ProfileSettingsProps) {
  const profile = useProfile();
  // Sur ordinateur, la première ligne est ouverte d'emblée ; sur mobile, rien tant qu'on ne touche pas.
  const [active, setActive] = useState<SectionId | null>(null);
  const [desktop, setDesktop] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(id);
  }, [toast]);

  // Échap ferme la feuille mobile.
  useEffect(() => {
    if (desktop || active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [desktop, active]);

  const current: SectionId | null = active ?? (desktop ? "name" : null);
  const section = SECTIONS.find((s) => s.id === current) ?? null;

  function saved(message: string) {
    setToast(message);
    if (!desktop) setActive(null);
  }

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    try {
      updateProfile({ photo: await shrinkImage(file, 400) });
      setToast("Photo de profil mise à jour");
    } catch {
      setToast("Image illisible");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const editor = section ? (
    <div key={section.id} className={styles.panelIn}>
      {section.id === "name" ? <NameEditor profile={profile} onSaved={saved} /> : null}
      {section.id === "bio" ? <BioEditor profile={profile} onSaved={saved} /> : null}
      {section.id === "work" ? <WorkEditor profile={profile} onSaved={saved} /> : null}
      {section.id === "location" ? <LocationEditor profile={profile} onSaved={saved} /> : null}
      {section.id === "links" ? <LinksEditor profile={profile} onSaved={saved} /> : null}
      {section.id === "email" ? <EmailEditor profile={profile} onSaved={saved} /> : null}
      {section.id === "password" ? <PasswordEditor profile={profile} onSaved={saved} /> : null}
      {section.id === "blocked" ? <BlockedEditor profile={profile} onSaved={saved} /> : null}
    </div>
  ) : null;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start lg:gap-6">
      {/* ---------- identité et lignes ---------- */}
      <div className="flex flex-col gap-4">
        <section className={`${styles.identity} px-4 pb-4 pt-10`} aria-label="Identité">
          <div className="relative flex flex-col items-center text-center">
            <span className={styles.avatarWrap}>
              <Avatar person={profile} size={104} className="ring-4 ring-surface" />
              <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => void onPhoto(e.target.files?.[0])} />
              <button type="button" onClick={() => fileRef.current?.click()} aria-label="Changer la photo de profil" className={styles.avatarBadge}>
                <CameraIcon width={15} height={15} />
              </button>
            </span>
            <h2 className="mt-3 font-display text-[1.7rem] leading-none tracking-tight text-graphite">{fullName(profile)}</h2>
            <p className="mt-1.5 text-[13px] text-graphite-muted">{profile.role} · {profile.company}</p>
            <p className="mt-1 text-[12px] text-graphite-faint">Membre depuis le {memberSince.format(new Date(profile.memberSince))}</p>
          </div>

          <nav aria-label="Réglages du profil" className={`${styles.rows} mt-6`}>
            {SECTIONS.map((s) => {
              const value = s.value(profile);
              const isActive = s.id === current;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActive(s.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={`${styles.row} ${isActive ? styles.rowActive : ""}`}
                >
                  <span className="min-w-0 flex-1">
                    <span className={styles.rowLabel}>{s.label}</span>
                    <span className={`${styles.rowValue} ${value ? "" : styles.rowEmpty}`}>{value ?? EMPTY_LABEL[s.id] ?? "—"}</span>
                  </span>
                  <span className={styles.rowIcon}><s.icon width={18} height={18} /></span>
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => setToast("La déconnexion sera active avec les comptes")}
            className="mt-5 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-leaf/30 bg-leaf-soft text-[14.5px] font-semibold text-leaf-ink transition-colors hover:bg-[#f0d0d0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf"
          >
            <LogOutIcon width={18} height={18} />
            Se déconnecter
          </button>
        </section>

        {/* sur mobile, les sections complémentaires suivent la liste */}
        {extra ? <div className="flex flex-col gap-4 lg:hidden">{extra}</div> : null}
      </div>

      {/* ---------- panneau (ordinateur) ---------- */}
      <div className="hidden flex-col gap-4 lg:flex">
        {section ? (
          <section className={`${styles.panel} p-6`} aria-label={section.title}>
            <header className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-graphite-faint">Profil</p>
                <h3 className="mt-1 font-display text-[1.5rem] leading-tight text-graphite">{section.title}</h3>
              </div>
              <button type="button" onClick={() => setActive("name")} aria-label="Revenir au nom" className="grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-paper text-graphite-muted hover:text-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm">
                <XIcon width={18} height={18} />
              </button>
            </header>
            {editor}
          </section>
        ) : null}
        {extra}
      </div>

      {/* ---------- feuille (mobile) ---------- */}
      {!desktop && section ? (
        <>
          <div className={styles.scrim} onClick={() => setActive(null)} aria-hidden />
          <div className={styles.sheet} role="dialog" aria-modal="true" aria-label={section.title}>
            <div className={styles.handle} aria-hidden />
            <header className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-graphite-faint">Profil</p>
                <h3 className="mt-1 font-display text-[1.4rem] leading-tight text-graphite">{section.title}</h3>
              </div>
              <button type="button" onClick={() => setActive(null)} aria-label="Fermer" className="grid h-10 w-10 cursor-pointer place-items-center rounded-full text-graphite-muted hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm">
                <XIcon width={20} height={20} />
              </button>
            </header>
            {editor}
          </div>
        </>
      ) : null}

      {toast ? (
        <p role="status" className={styles.toast}>
          <CheckIcon width={16} height={16} style={{ color: "#2f9a68" }} />
          {toast}
        </p>
      ) : null}
    </div>
  );
}
