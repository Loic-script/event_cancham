"use client";

import { useActionState, useState } from "react";
import { changerMotDePasse, modifierIdentifiants, type CompteState } from "@/app/(app)/profil/actions";
import { CheckIcon, LockIcon } from "@/components/app/icons";
import { oublierChampsLocaux, useSessionIdentity } from "@/components/profile/useProfile";
import { ChoixPhotoProfil } from "../profil/ChoixPhotoProfil";
import { AvatarProfil, Btn, Card, Champ, Note, PageHead, Puce, Sur, ui } from "../ui";

type Compte = { firstName: string; lastName: string; email: string; depuis: string };

const initial: CompteState = { error: null, message: null };

async function envoyerIdentifiants(previous: CompteState, formData: FormData) {
  const resultat = await modifierIdentifiants(previous, formData);
  if (!resultat.error) oublierChampsLocaux(["firstName", "lastName", "email"]);
  return resultat;
}

export function AdminCompte({ compte }: { compte: Compte }) {
  const [identite, actionIdentite, enregistrement] = useActionState(envoyerIdentifiants, initial);
  const [mdp, actionMdp, changement] = useActionState(changerMotDePasse, initial);
  const [f, setF] = useState({ firstName: compte.firstName, lastName: compte.lastName, email: compte.email });
  const [voir, setVoir] = useState(false);
  const photo = useSessionIdentity()?.photo ?? null;

  const nouvelleAdresse = f.email.trim().toLowerCase() !== compte.email;
  const modifie = f.firstName.trim() !== compte.firstName || f.lastName.trim() !== compte.lastName || nouvelleAdresse;

  return (
    <>
      <PageHead title="Mon" accent="compte" text="Votre photo et vos informations de connexion au back-office : nom, adresse e-mail et mot de passe." photo="assistance">
        <Puce tone="white">Administrateur depuis le {new Date(compte.depuis).toLocaleDateString("fr-FR")}</Puce>
      </PageHead>

      <Card pad bleed className="mb-4 flex flex-wrap items-center gap-4">
        <AvatarProfil photo={photo} size={72} />
        <div className="min-w-0 flex-1">
          <Sur className="!mb-1">Photo de profil</Sur>
          <p className="text-graphite-muted">Visible par l’équipe dans la liste des administrateurs et sur votre fiche.</p>
        </div>
        <ChoixPhotoProfil small />
      </Card>

      <div className={ui.gLarge}>
        <Card pad bleed>
          <Sur>Informations</Sur>
          <form action={actionIdentite} className="grid gap-3.5">
            <div className={ui.g2}>
              <Champ label="Prénom" htmlFor="compte-prenom">
                <input
                  id="compte-prenom"
                  name="firstName"
                  className={ui.saisie}
                  required
                  maxLength={60}
                  autoComplete="given-name"
                  value={f.firstName}
                  onChange={(e) => setF({ ...f, firstName: e.target.value })}
                />
              </Champ>
              <Champ label="Nom" htmlFor="compte-nom">
                <input
                  id="compte-nom"
                  name="lastName"
                  className={ui.saisie}
                  required
                  maxLength={60}
                  autoComplete="family-name"
                  value={f.lastName}
                  onChange={(e) => setF({ ...f, lastName: e.target.value })}
                />
              </Champ>
            </div>
            <Champ label="Adresse e-mail" htmlFor="compte-email" hint="C’est l’adresse qui sert à vous connecter.">
              <input
                id="compte-email"
                name="email"
                type="email"
                className={ui.saisie}
                required
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                value={f.email}
                onChange={(e) => setF({ ...f, email: e.target.value })}
              />
            </Champ>
            {nouvelleAdresse ? (
              <Champ label="Mot de passe actuel" htmlFor="compte-mdp-email" hint="Nécessaire pour changer l’adresse de connexion.">
                <input id="compte-mdp-email" name="motDePasse" type="password" className={ui.saisie} required autoComplete="current-password" />
              </Champ>
            ) : null}
            {identite.error ? <Note tone="red">{identite.error}</Note> : null}
            {identite.message ? <Note tone="green">{identite.message}</Note> : null}
            <div>
              <Btn type="submit" variant="primary" disabled={enregistrement || !modifie}>
                <CheckIcon width={16} height={16} />
                {enregistrement ? "Enregistrement…" : "Enregistrer"}
              </Btn>
            </div>
          </form>
        </Card>

        <Card pad bleed>
          <Sur>Mot de passe</Sur>
          <form action={actionMdp} className="grid gap-3.5">
            <input type="email" autoComplete="username" value={compte.email} readOnly hidden />
            <Champ label="Mot de passe actuel" htmlFor="compte-mdp-actuel">
              <input id="compte-mdp-actuel" name="actuel" type={voir ? "text" : "password"} className={ui.saisie} required autoComplete="current-password" />
            </Champ>
            <Champ label="Nouveau mot de passe" htmlFor="compte-mdp-nouveau" hint="8 caractères minimum.">
              <input id="compte-mdp-nouveau" name="nouveau" type={voir ? "text" : "password"} className={ui.saisie} required minLength={8} autoComplete="new-password" />
            </Champ>
            <Champ label="Confirmer le nouveau mot de passe" htmlFor="compte-mdp-confirmation">
              <input id="compte-mdp-confirmation" name="confirmation" type={voir ? "text" : "password"} className={ui.saisie} required minLength={8} autoComplete="new-password" />
            </Champ>
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-graphite-muted">
              <input type="checkbox" checked={voir} onChange={(e) => setVoir(e.target.checked)} className="h-4 w-4 accent-[#f26b1d]" />
              Afficher les mots de passe
            </label>
            {mdp.error ? <Note tone="red">{mdp.error}</Note> : null}
            {mdp.message ? <Note tone="green">{mdp.message}</Note> : null}
            <div>
              <Btn type="submit" variant="primary" disabled={changement}>
                <LockIcon width={16} height={16} />
                {changement ? "Modification…" : "Changer le mot de passe"}
              </Btn>
            </div>
            <p className="text-[12.5px] text-graphite-faint">Les autres appareils connectés à ce compte seront déconnectés.</p>
          </form>
        </Card>
      </div>
    </>
  );
}
