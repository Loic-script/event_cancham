"use client";

import { useActionState, useState } from "react";
import { changerMotDePasse, modifierCoordonnees, type CompteState } from "@/app/(app)/profil/actions";
import { EyeIcon, EyeOffIcon, LinkIcon, LockIcon, MailIcon, PhoneIcon } from "@/components/app/icons";
import { oublierChampsLocaux, useProfile } from "@/components/profile/useProfile";
import { Btn, Champ, Jauge, Note, Sur, ui } from "../ui";

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

const initial: CompteState = { error: null, message: null };

export function Coordonnees() {
  const me = useProfile();
  const [state, action, pending] = useActionState(modifierCoordonnees, initial);
  const [f, setF] = useState({ email: me.email, phone: me.phone ?? "", website: me.website ?? "", motDePasse: "" });
  const [vu, setVu] = useState(state);
  if (vu !== state) {
    setVu(state);
    if (state.message) {
      // Enregistré sur le compte : les anciennes valeurs gardées dans ce navigateur ne servent plus.
      oublierChampsLocaux(["email", "phone", "website"]);
      setF((x) => ({ ...x, motDePasse: "" }));
    }
  }
  const nouvelleAdresse = f.email.trim().toLowerCase() !== me.email.toLowerCase();

  return (
    <form action={action} className={`${ui.card} ${ui.pad} m-bleed mt-4 grid gap-4`}>
      <Sur className="!mb-0">Compte</Sur>
      <Champ label="Adresse e-mail (pour vous connecter)" htmlFor="c-email">
        <div className="relative">
          <MailIcon width={17} height={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graphite-faint" />
          <input id="c-email" name="email" type="email" className={`${ui.saisie} !pl-10`} required autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </div>
      </Champ>
      {nouvelleAdresse ? (
        <Champ label="Mot de passe actuel (pour changer d’adresse)" htmlFor="c-mdp">
          <div className="relative">
            <LockIcon width={17} height={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graphite-faint" />
            <input id="c-mdp" name="motDePasse" type="password" className={`${ui.saisie} !pl-10`} required autoComplete="current-password" value={f.motDePasse} onChange={(e) => setF({ ...f, motDePasse: e.target.value })} />
          </div>
        </Champ>
      ) : null}
      <div className={ui.g2}>
        <Champ label="Numéro de téléphone" htmlFor="c-phone">
          <div className="relative">
            <PhoneIcon width={17} height={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graphite-faint" />
            <input id="c-phone" name="phone" type="tel" inputMode="tel" className={`${ui.saisie} !pl-10`} autoComplete="tel" placeholder="+261 34 00 000 00" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          </div>
        </Champ>
        <Champ label="Site web" htmlFor="c-web">
          <div className="relative">
            <LinkIcon width={17} height={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graphite-faint" />
            <input id="c-web" name="website" type="text" inputMode="url" className={`${ui.saisie} !pl-10`} autoComplete="url" placeholder="www.votre-entreprise.mg" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} />
          </div>
        </Champ>
      </div>
      {state.error ? <Note tone="red">{state.error}</Note> : null}
      {state.message ? <Note tone="green">{state.message}</Note> : null}
      <div>
        <Btn variant="primary" type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Btn>
      </div>
    </form>
  );
}

export function MotDePasse() {
  const [state, action, pending] = useActionState(changerMotDePasse, initial);
  const [actuel, setActuel] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirm, setConfirm] = useState("");
  const [voir, setVoir] = useState({ actuel: false, nouveau: false, confirm: false });
  const [vu, setVu] = useState(state);
  if (vu !== state) {
    setVu(state);
    if (state.message) {
      setActuel("");
      setNouveau("");
      setConfirm("");
    }
  }
  const niveau = robustesse(nouveau);

  return (
    <form action={action} className={`${ui.card} ${ui.pad} m-bleed mt-4 grid gap-4`}>
      <Sur className="!mb-0">Changer le mot de passe</Sur>
      <Champ label="Mot de passe actuel" htmlFor="mdp-actuel">
        <div className="relative">
          <LockIcon width={17} height={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graphite-faint" />
          <input id="mdp-actuel" name="actuel" type={voir.actuel ? "text" : "password"} className={`${ui.saisie} !px-10`} required autoComplete="current-password" value={actuel} onChange={(e) => setActuel(e.target.value)} />
          <Oeil on={voir.actuel} onToggle={() => setVoir({ ...voir, actuel: !voir.actuel })} />
        </div>
      </Champ>
      <div className={ui.g2}>
        <Champ label="Nouveau mot de passe" htmlFor="mdp-nouveau">
          <div className="relative">
            <input id="mdp-nouveau" name="nouveau" type={voir.nouveau ? "text" : "password"} className={`${ui.saisie} !pr-10`} required minLength={8} autoComplete="new-password" value={nouveau} onChange={(e) => setNouveau(e.target.value)} />
            <Oeil on={voir.nouveau} onToggle={() => setVoir({ ...voir, nouveau: !voir.nouveau })} />
          </div>
        </Champ>
        <Champ label="Confirmer le nouveau mot de passe" htmlFor="mdp-confirm">
          <div className="relative">
            <input id="mdp-confirm" name="confirmation" type={voir.confirm ? "text" : "password"} className={`${ui.saisie} !pr-10`} required minLength={8} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-invalid={confirm.length > 0 && confirm !== nouveau} />
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
      {state.error ? <Note tone="red">{state.error}</Note> : null}
      {state.message ? <Note tone="green">{state.message}</Note> : null}
      <div className="flex flex-wrap items-center gap-3">
        <Btn variant="primary" type="submit" disabled={pending || !actuel || nouveau.length < 8 || nouveau !== confirm}>
          <LockIcon width={16} height={16} />
          {pending ? "Modification…" : "Modifier le mot de passe"}
        </Btn>
        <span className="text-[12.5px] text-graphite-faint">Vos autres appareils seront déconnectés.</span>
      </div>
    </form>
  );
}
