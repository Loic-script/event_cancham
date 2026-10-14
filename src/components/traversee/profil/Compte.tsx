"use client";

import { useState, type FormEvent } from "react";
import { EyeIcon, EyeOffIcon, LinkIcon, LockIcon, MailIcon, PhoneIcon } from "@/components/app/icons";
import { updateProfile, useProfile } from "@/components/profile/useProfile";
import { toast } from "@/lib/traversee/store";
import { Btn, Champ, Jauge, Sur, ui } from "../ui";

const MOT_DE_PASSE_ACTUEL = "traversee2026";

function robustesse(mdp: string) {
  let n = 0;
  if (mdp.length >= 8) n++;
  if (mdp.length >= 12) n++;
  if (/[A-Z]/.test(mdp) && /[a-z]/.test(mdp)) n++;
  if (/\d/.test(mdp)) n++;
  if (/[^A-Za-z0-9]/.test(mdp)) n++;
  return n;
}

const NIVEAUX = ["Trop court", "Faible", "Moyen", "Bon", "Solide", "Excellent"];

function Oeil({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} aria-label={on ? "Masquer le mot de passe" : "Afficher le mot de passe"} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-graphite-faint hover:bg-paper hover:text-graphite">
      {on ? <EyeOffIcon width={17} height={17} /> : <EyeIcon width={17} height={17} />}
    </button>
  );
}

export function Coordonnees() {
  const me = useProfile();
  const [f, setF] = useState({ email: me.email, phone: me.phone ?? "", website: me.website ?? "" });

  function enregistrer(e: FormEvent) {
    e.preventDefault();
    const email = f.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast("Adresse e-mail invalide.");
    const phone = f.phone.trim();
    if (phone && !/^\+?[\d\s().-]{7,20}$/.test(phone)) return toast("Numéro de téléphone invalide.");
    let website = f.website.trim();
    if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
    if (website && !/^https?:\/\/[^\s/]+\.[^\s]+$/i.test(website)) return toast("Adresse de site web invalide.");
    updateProfile({ email, phone, website });
    setF({ email, phone, website });
    toast("Coordonnées enregistrées.");
  }

  return (
    <form onSubmit={enregistrer} className={`${ui.card} ${ui.pad} m-bleed mt-4 grid gap-4`}>
      <Sur className="!mb-0">Compte</Sur>
      <Champ label="Adresse e-mail" htmlFor="c-email">
        <div className="relative">
          <MailIcon width={17} height={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graphite-faint" />
          <input id="c-email" type="email" className={`${ui.saisie} !pl-10`} required autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </div>
      </Champ>
      <div className={ui.g2}>
        <Champ label="Numéro de téléphone" htmlFor="c-phone">
          <div className="relative">
            <PhoneIcon width={17} height={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graphite-faint" />
            <input id="c-phone" type="tel" inputMode="tel" className={`${ui.saisie} !pl-10`} autoComplete="tel" placeholder="+261 34 00 000 00" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          </div>
        </Champ>
        <Champ label="Site web" htmlFor="c-web">
          <div className="relative">
            <LinkIcon width={17} height={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graphite-faint" />
            <input id="c-web" type="text" inputMode="url" className={`${ui.saisie} !pl-10`} autoComplete="url" placeholder="www.votre-entreprise.mg" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} />
          </div>
        </Champ>
      </div>
      <div>
        <Btn variant="primary" type="submit">
          Enregistrer
        </Btn>
      </div>
    </form>
  );
}

export function MotDePasse() {
  const me = useProfile();
  const [actuel, setActuel] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirm, setConfirm] = useState("");
  const [voir, setVoir] = useState({ actuel: false, nouveau: false, confirm: false });
  const niveau = robustesse(nouveau);
  const dernier = me.passwordChangedAt ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(me.passwordChangedAt)) : null;

  function changer(e: FormEvent) {
    e.preventDefault();
    if (actuel !== MOT_DE_PASSE_ACTUEL) return toast("Le mot de passe actuel est incorrect.");
    if (nouveau.length < 8) return toast("Le nouveau mot de passe doit faire au moins 8 caractères.");
    if (nouveau === actuel) return toast("Choisissez un mot de passe différent de l’actuel.");
    if (nouveau !== confirm) return toast("Les deux mots de passe ne correspondent pas.");
    updateProfile({ passwordChangedAt: new Date().toISOString() });
    setActuel("");
    setNouveau("");
    setConfirm("");
    toast("Mot de passe modifié.");
  }

  return (
    <form onSubmit={changer} className={`${ui.card} ${ui.pad} m-bleed mt-4 grid gap-4`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Sur className="!mb-0">Changer le mot de passe</Sur>
        {dernier ? <span className="text-[12.5px] text-graphite-muted">Dernier changement le {dernier}</span> : null}
      </div>
      <Champ label="Mot de passe actuel" htmlFor="mdp-actuel">
        <div className="relative">
          <LockIcon width={17} height={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graphite-faint" />
          <input id="mdp-actuel" type={voir.actuel ? "text" : "password"} className={`${ui.saisie} !px-10`} required autoComplete="current-password" value={actuel} onChange={(e) => setActuel(e.target.value)} />
          <Oeil on={voir.actuel} onToggle={() => setVoir({ ...voir, actuel: !voir.actuel })} />
        </div>
      </Champ>
      <div className={ui.g2}>
        <Champ label="Nouveau mot de passe" htmlFor="mdp-nouveau">
          <div className="relative">
            <input id="mdp-nouveau" type={voir.nouveau ? "text" : "password"} className={`${ui.saisie} !pr-10`} required minLength={8} autoComplete="new-password" value={nouveau} onChange={(e) => setNouveau(e.target.value)} />
            <Oeil on={voir.nouveau} onToggle={() => setVoir({ ...voir, nouveau: !voir.nouveau })} />
          </div>
        </Champ>
        <Champ label="Confirmer le nouveau mot de passe" htmlFor="mdp-confirm">
          <div className="relative">
            <input id="mdp-confirm" type={voir.confirm ? "text" : "password"} className={`${ui.saisie} !pr-10`} required minLength={8} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-invalid={confirm.length > 0 && confirm !== nouveau} />
            <Oeil on={voir.confirm} onToggle={() => setVoir({ ...voir, confirm: !voir.confirm })} />
          </div>
        </Champ>
      </div>
      {nouveau ? (
        <div>
          <Jauge pct={(niveau / 5) * 100} />
          <small className="text-graphite-muted">Robustesse : {NIVEAUX[niveau]}. Au moins 8 caractères, avec majuscules, chiffres et symboles.</small>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <Btn variant="primary" type="submit" disabled={!actuel || nouveau.length < 8 || nouveau !== confirm}>
          <LockIcon width={16} height={16} />
          Modifier le mot de passe
        </Btn>
        <span className="text-[12.5px] text-graphite-faint">Démonstration : le mot de passe actuel est « traversee2026 ».</span>
      </div>
    </form>
  );
}
