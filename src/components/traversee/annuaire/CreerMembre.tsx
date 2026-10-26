"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { creerParticipant, type CreationState } from "@/app/(app)/admin/participants/actions";
import { CheckIcon, CopyIcon, SpinnerIcon, UserPlusIcon } from "@/components/app/icons";
import { SECTEURS } from "@/lib/traversee/data";
import { Modal } from "../Modal";
import { Btn, Champ, Note, ui } from "../ui";
import styles from "./annuaire.module.css";

const initial: CreationState = { error: null, message: null, motDePasse: null, email: null };

/** Fenêtre « Créer un utilisateur » de l'annuaire admin : compte membre complet, accès ouvert sans paiement en ligne. */
export function CreerMembre({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(creerParticipant, initial);
  const [, demarrer] = useTransition();
  const [cle, setCle] = useState(0);
  const [masque, setMasque] = useState<CreationState | null>(null);
  const [copie, setCopie] = useState(false);
  const cree = Boolean(state.message && !state.error);

  useEffect(() => {
    if (cree) router.refresh();
  }, [cree, state, router]);

  function copier() {
    if (!state.motDePasse) return;
    void navigator.clipboard.writeText(state.motDePasse).then(() => setCopie(true));
  }

  return (
    <Modal onClose={onClose} label="Créer un utilisateur" size="large">
      <div className={styles.creerTete}>
        <span className={styles.creerIcone}>
          <UserPlusIcon width={22} height={22} />
        </span>
        <div>
          <h3 className="font-display text-[20px] text-graphite">Créer un utilisateur</h3>
          <p className="text-[13.5px] text-graphite-muted">Compte membre complet, accès ouvert tout de suite, sans paiement en ligne.</p>
        </div>
      </div>

      {cree && state !== masque ? (
        <div className="mt-4 grid gap-3">
          <Note tone="green">{state.message}</Note>
          {state.motDePasse ? (
            <div className={styles.motDePasse}>
              <div className="min-w-0">
                <small>Mot de passe provisoire de {state.email}</small>
                <code>{state.motDePasse}</code>
              </div>
              <Btn small onClick={copier}>
                {copie ? <CheckIcon width={15} height={15} /> : <CopyIcon width={15} height={15} />}
                {copie ? "Copié" : "Copier"}
              </Btn>
            </div>
          ) : null}
          {state.motDePasse ? <p className="text-[12.5px] text-graphite-muted">Il ne sera plus affiché après la fermeture de cette fenêtre. Le membre pourra le changer depuis son profil.</p> : null}
          <div className="mt-1 flex flex-wrap justify-end gap-2">
            <Btn
              onClick={() => {
                setCopie(false);
                setMasque(state);
                setCle((n) => n + 1);
              }}
            >
              Créer un autre utilisateur
            </Btn>
            <Btn variant="primary" onClick={onClose}>
              Terminé
            </Btn>
          </div>
        </div>
      ) : (
        <form
          key={cle}
          onSubmit={(e) => {
            e.preventDefault();
            const donnees = new FormData(e.currentTarget);
            demarrer(() => action(donnees));
          }}
          className={`${styles.creerForm} mt-4`}
        >
          <fieldset>
            <legend>Identité et contact</legend>
            <div className={styles.creerGrille}>
              <Champ label="Prénom" htmlFor="cm-prenom">
                <input id="cm-prenom" name="firstName" className={ui.saisie} required maxLength={60} autoComplete="off" />
              </Champ>
              <Champ label="Nom" htmlFor="cm-nom">
                <input id="cm-nom" name="lastName" className={ui.saisie} required maxLength={60} autoComplete="off" />
              </Champ>
              <Champ label="Adresse e-mail" htmlFor="cm-email" hint="Les identifiants y sont envoyés.">
                <input id="cm-email" name="email" type="email" className={ui.saisie} required autoComplete="off" />
              </Champ>
              <Champ label="Téléphone" htmlFor="cm-tel">
                <input id="cm-tel" name="phone" type="tel" className={ui.saisie} required placeholder="+261 34 00 000 00" autoComplete="off" />
              </Champ>
            </div>
          </fieldset>

          <fieldset>
            <legend>Entreprise</legend>
            <div className={styles.creerGrille}>
              <Champ label="Entreprise" htmlFor="cm-ent">
                <input id="cm-ent" name="company" className={ui.saisie} required maxLength={80} />
              </Champ>
              <Champ label="Fonction" htmlFor="cm-role">
                <input id="cm-role" name="role" className={ui.saisie} required maxLength={80} />
              </Champ>
              <Champ label="Secteur" htmlFor="cm-secteur">
                <select id="cm-secteur" name="sector" className={ui.saisie} defaultValue="">
                  <option value="">À choisir plus tard</option>
                  {SECTEURS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Champ>
              <Champ label="Ville" htmlFor="cm-ville">
                <input id="cm-ville" name="city" className={ui.saisie} maxLength={80} placeholder="Antananarivo" />
              </Champ>
              <Champ label="Site web" htmlFor="cm-site">
                <input id="cm-site" name="website" className={ui.saisie} maxLength={200} placeholder="https://" />
              </Champ>
              <Champ label="Billet" htmlFor="cm-billet" hint="Aucun paiement en ligne n’est demandé.">
                <select id="cm-billet" name="billet" className={ui.saisie} defaultValue="paye">
                  <option value="paye">Réglé hors plateforme ou offert</option>
                  <option value="attente">À régler (sur place)</option>
                </select>
              </Champ>
            </div>
            <Champ label="Présentation" htmlFor="cm-bio" hint="Facultatif · 600 caractères au plus.">
              <textarea id="cm-bio" name="bio" className={ui.saisie} maxLength={600} rows={3} placeholder="Activité, ce qu’il ou elle vient chercher à La Traversée…" />
            </Champ>
          </fieldset>

          {state.error && state !== masque ? (
            <p className={styles.creerErreur} role="alert">
              {state.error}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            <Btn onClick={onClose} disabled={pending}>
              Annuler
            </Btn>
            <Btn variant="primary" type="submit" disabled={pending}>
              {pending ? <SpinnerIcon width={15} height={15} className="animate-spin" /> : <UserPlusIcon width={15} height={15} />}
              Créer le compte
            </Btn>
          </div>
        </form>
      )}
    </Modal>
  );
}
