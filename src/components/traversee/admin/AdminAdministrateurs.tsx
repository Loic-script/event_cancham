"use client";

import { useActionState, useState } from "react";
import { ajouterAdmin, type AjoutState } from "@/app/(app)/admin/administrateurs/actions";
import { ChevronRightIcon, UserPlusIcon } from "@/components/app/icons";
import { AvatarProfil, Btn, Card, Champ, Note, PageHead, Puce, Sur, ui } from "../ui";
import { AdminFiche, dateLongue, type AdminVue } from "./AdminFiche";
import styles from "./administrateurs.module.css";

type Membre = { email: string; nom: string };

const initial: AjoutState = { error: null, message: null };

export function AdminAdministrateurs({ moi, superAdmin, superAdmins, admins, membres }: { moi: number; superAdmin: boolean; superAdmins: string[]; admins: AdminVue[]; membres: Membre[] }) {
  const [state, formAction, pending] = useActionState(ajouterAdmin, initial);
  const [ouvert, setOuvert] = useState<number | null>(null);
  const fiche = admins.find((a) => a.id === ouvert) ?? null;

  return (
    <>
      <PageHead title="Équipe" accent="administrateurs" text={superAdmin ? "Les comptes qui ont accès au back-office. Ouvrez une fiche pour modifier un administrateur, lui retirer ses droits ou supprimer son compte." : "Les comptes qui ont accès au back-office. Ouvrez une fiche pour voir les coordonnées d’un administrateur."} photo="equipe">
        <Puce tone="white">
          {admins.length} administrateur{admins.length > 1 ? "s" : ""}
        </Puce>
      </PageHead>

      <div className={ui.gLarge}>
        <Card pad bleed>
          <div className={styles.entete}>
            <Sur className="!mb-0">Administrateurs</Sur>
          </div>
          <ul className={styles.liste}>
            {admins.map((a) => (
              <li key={a.id}>
                <button type="button" className={`${styles.ligne} ${a.superAdmin ? styles.superAdmin : ""}`} onClick={() => setOuvert(a.id)} aria-label={`Voir la fiche de ${a.nom}`}>
                  <AvatarProfil size={46} />
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
        </Card>

        {superAdmin ? (
          <Card pad bleed>
            <Sur>Ajouter un administrateur</Sur>
            <form action={formAction} className="grid gap-3.5">
              <Champ label="Adresse e-mail" htmlFor="admin-email" hint="Un membre déjà inscrit devient administrateur ; sinon, un compte est créé. Dans les deux cas, un mot de passe tiré au hasard lui est envoyé par e-mail.">
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
                <Champ label="Prénom" htmlFor="admin-prenom">
                  <input id="admin-prenom" name="firstName" className={ui.saisie} autoComplete="off" />
                </Champ>
                <Champ label="Nom" htmlFor="admin-nom">
                  <input id="admin-nom" name="lastName" className={ui.saisie} autoComplete="off" />
                </Champ>
              </div>
              {state.error ? <Note tone="red">{state.error}</Note> : null}
              {state.message ? <Note tone="green">{state.message}</Note> : null}
              <Btn type="submit" variant="primary" disabled={pending}>
                <UserPlusIcon width={16} height={16} />
                {pending ? "Ajout…" : "Ajouter l’administrateur"}
              </Btn>
            </form>
          </Card>
        ) : (
          <Card pad bleed className="grid content-start gap-1.5">
            <Sur className="!mb-0">Gestion des administrateurs</Sur>
            <p className="text-graphite-muted">
              Seul le super admin{superAdmins.length ? ` (${superAdmins.join(", ")})` : ""} peut ajouter un administrateur, lui retirer ses droits ou supprimer son compte.
            </p>
          </Card>
        )}
      </div>

      {fiche ? <AdminFiche key={`${fiche.id}-${fiche.email}-${fiche.nom}`} admin={fiche} moi={fiche.id === moi} peutGerer={superAdmin && fiche.id !== moi && !fiche.superAdmin} onClose={() => setOuvert(null)} /> : null}
    </>
  );
}
