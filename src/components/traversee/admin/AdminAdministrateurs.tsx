"use client";

import { useActionState, useState } from "react";
import { ajouterAdmin, type AjoutState } from "@/app/(app)/admin/administrateurs/actions";
import { ChevronRightIcon, UserPlusIcon, XIcon } from "@/components/app/icons";
import { Modal } from "../Modal";
import { AvatarProfil, Btn, Card, Champ, Note, PageHead, Puce, Sur, ui } from "../ui";
import { AdminFiche, dateLongue, type AdminVue } from "./AdminFiche";
import styles from "./administrateurs.module.css";

type Membre = { email: string; nom: string };

const initial: AjoutState = { error: null, message: null };

/** Page « Accès & équipe » : les comptes qui ont accès au back-office ; un super admin y crée un utilisateur (admin ou super admin). */
export function AdminAdministrateurs({ moi, superAdmin, superAdmins, admins, membres }: { moi: number; superAdmin: boolean; superAdmins: string[]; admins: AdminVue[]; membres: Membre[] }) {
  const [ouvert, setOuvert] = useState<number | null>(null);
  const [creer, setCreer] = useState(false);
  const fiche = admins.find((a) => a.id === ouvert) ?? null;

  return (
    <>
      <PageHead
        title="Accès &"
        accent="équipe"
        text={superAdmin ? "Les comptes qui ont accès au back-office. Ouvrez une fiche pour modifier un administrateur, changer son niveau, lui retirer ses droits ou supprimer son compte." : "Les comptes qui ont accès au back-office. Ouvrez une fiche pour voir les coordonnées d’un administrateur."}
        photo="equipe"
      >
        <Puce tone="white">
          {admins.length} administrateur{admins.length > 1 ? "s" : ""}
        </Puce>
        {superAdmin ? (
          <Btn variant="primary" onClick={() => setCreer(true)}>
            <UserPlusIcon width={16} height={16} />
            Créer un utilisateur
          </Btn>
        ) : null}
      </PageHead>

      <Card pad bleed>
        <div className={styles.entete}>
          <Sur className="!mb-0">Administrateurs</Sur>
        </div>
        <ul className={styles.liste}>
          {admins.map((a) => (
            <li key={a.id}>
              <button type="button" className={`${styles.ligne} ${a.superAdmin ? styles.superAdmin : ""}`} onClick={() => setOuvert(a.id)} aria-label={`Voir la fiche de ${a.nom}`}>
                <AvatarProfil photo={a.photo} size={46} />
                <span className={styles.ident}>
                  <span className={styles.nom}>
                    {a.nom}
                    {a.superAdmin ? <Puce tone="red">Super admin</Puce> : null}
                    {a.id === moi ? <Puce tone="grey">Vous</Puce> : null}
                  </span>
                  <small>{a.email}</small>
                  {a.role || a.company ? <small>{[a.role, a.company].filter(Boolean).join(" · ")}</small> : null}
                </span>
                <span className={styles.meta}>
                  <strong>{a.derniereConnexion ? "Dernière connexion" : "Jamais connecté"}</strong>
                  {a.derniereConnexion ? dateLongue(a.derniereConnexion) : `Admin depuis le ${dateLongue(a.adminDepuis)}`}
                </span>
                <ChevronRightIcon width={18} height={18} className={styles.chevron} />
              </button>
            </li>
          ))}
        </ul>
        {superAdmin ? null : (
          <p className="mt-4 text-[13px] text-graphite-muted">
            Seul un super admin{superAdmins.length ? ` (${superAdmins.join(", ")}…)` : ""} peut créer un utilisateur, changer son niveau, lui retirer ses droits ou supprimer son compte.
          </p>
        )}
      </Card>

      {creer ? <CreerUtilisateur membres={membres} onClose={() => setCreer(false)} /> : null}
      {fiche ? <AdminFiche key={`${fiche.id}-${fiche.email}-${fiche.nom}`} admin={fiche} moi={fiche.id === moi} peutGerer={superAdmin && fiche.id !== moi && !fiche.fixe} onClose={() => setOuvert(null)} /> : null}
    </>
  );
}

/** Fenêtre « Créer un utilisateur » : adresse (membre existant ou nouveau compte), prénom, nom, et le niveau : administrateur ou super admin. */
function CreerUtilisateur({ membres, onClose }: { membres: Membre[]; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(ajouterAdmin, initial);

  return (
    <Modal onClose={onClose} label="Créer un utilisateur">
      <div className={styles.entete}>
        <div>
          <h2 className="font-display text-[19px] text-graphite">Créer un utilisateur</h2>
          <p className="text-[13.5px] text-graphite-muted">Un membre déjà inscrit devient administrateur ; sinon, un compte est créé. Dans les deux cas, un mot de passe tiré au hasard lui est envoyé par e-mail.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Fermer" className={styles.fermer}>
          <XIcon width={18} height={18} />
        </button>
      </div>
      <form action={formAction} className="grid gap-3.5">
        <Champ label="Adresse e-mail" htmlFor="admin-email">
          <input id="admin-email" name="email" type="email" required className={ui.saisie} list="admin-membres" autoComplete="off" placeholder="nom@cancham.mg" />
          <datalist id="admin-membres">
            {membres.map((m) => (
              <option key={m.email} value={m.email}>
                {m.nom}
              </option>
            ))}
          </datalist>
        </Champ>
        <div className={ui.g2}>
          <Champ label="Prénom" htmlFor="admin-prenom" hint="Pour un nouveau compte.">
            <input id="admin-prenom" name="firstName" className={ui.saisie} autoComplete="off" />
          </Champ>
          <Champ label="Nom" htmlFor="admin-nom">
            <input id="admin-nom" name="lastName" className={ui.saisie} autoComplete="off" />
          </Champ>
        </div>
        <fieldset className={styles.niveaux}>
          <legend>Niveau</legend>
          <label className={styles.niveau}>
            <input type="radio" name="niveau" value="admin" defaultChecked />
            <span>
              <strong>Administrateur</strong>
              <small>Accès au back-office.</small>
            </span>
          </label>
          <label className={styles.niveau}>
            <input type="radio" name="niveau" value="super" />
            <span>
              <strong>Super admin</strong>
              <small>Gère aussi les administrateurs : créer, promouvoir, retirer, supprimer.</small>
            </span>
          </label>
        </fieldset>
        {state.error ? <Note tone="red">{state.error}</Note> : null}
        {state.message ? <Note tone="green">{state.message}</Note> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Btn onClick={onClose}>{state.message ? "Fermer" : "Annuler"}</Btn>
          <Btn type="submit" variant="primary" disabled={pending}>
            <UserPlusIcon width={16} height={16} />
            {pending ? "Création…" : "Créer l’utilisateur"}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}
