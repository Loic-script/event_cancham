"use client";

import { useActionState, useRef } from "react";
import { LockIcon, MailIcon, SpinnerIcon } from "@/components/app/icons";
import { Btn, Champ, ui } from "@/components/traversee/ui";
import { seConnecter, type EtatConnexion } from "./actions";

type Demo = { email: string; libelle: string; detail: string };

export function FormulaireConnexion({ suite, demos, motDePasseDemo }: { suite: string; demos: Demo[]; motDePasseDemo: string | null }) {
  const [etat, action, enCours] = useActionState<EtatConnexion, FormData>(seConnecter, { erreur: null, email: "" });
  const email = useRef<HTMLInputElement | null>(null);
  const mdp = useRef<HTMLInputElement | null>(null);

  return (
    <div className="grid gap-5">
      <form action={action} className="grid gap-4">
        <input type="hidden" name="suite" value={suite} />
        <Champ label="Adresse e-mail" htmlFor="cx-email">
          <div className="relative">
            <MailIcon width={17} height={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graphite-faint" />
            <input ref={email} id="cx-email" name="email" type="email" required autoComplete="username" defaultValue={etat.email} className={`${ui.saisie} !pl-10`} />
          </div>
        </Champ>
        <Champ label="Mot de passe" htmlFor="cx-mdp">
          <div className="relative">
            <LockIcon width={17} height={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graphite-faint" />
            <input ref={mdp} id="cx-mdp" name="motDePasse" type="password" required autoComplete="current-password" className={`${ui.saisie} !pl-10`} />
          </div>
        </Champ>
        {etat.erreur ? (
          <p role="alert" className="text-[13.5px] font-semibold text-leaf-ink">
            {etat.erreur}
          </p>
        ) : null}
        <Btn variant="primary" type="submit" disabled={enCours}>
          {enCours ? <SpinnerIcon width={16} height={16} className="animate-spin" /> : null}
          Se connecter
        </Btn>
      </form>
      {demos.length && motDePasseDemo ? (
        <div className="grid gap-2 rounded-2xl border border-dashed border-line bg-paper p-4">
          <p className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-graphite-faint">Comptes de démonstration</p>
          {demos.map((d) => (
            <button
              key={d.email}
              type="button"
              className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 text-left transition-colors hover:border-gold"
              onClick={() => {
                if (email.current) email.current.value = d.email;
                if (mdp.current) mdp.current.value = motDePasseDemo;
              }}
            >
              <span className="min-w-0">
                <strong className="block text-[14px] text-graphite">{d.libelle}</strong>
                <small className="block truncate text-[12.5px] text-graphite-muted">{d.email}</small>
              </span>
              <span className="shrink-0 text-[12px] font-bold text-leaf-ink">{d.detail}</span>
            </button>
          ))}
          <p className="text-[12.5px] text-graphite-muted">Mot de passe : « {motDePasseDemo} ». Visible en développement uniquement.</p>
        </div>
      ) : null}
    </div>
  );
}
