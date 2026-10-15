"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { ajouterAdmin, retirerAdmin, type AjoutState } from "@/app/(app)/admin/administrateurs/actions";
import { UserPlusIcon } from "@/components/app/icons";
import { toast } from "@/lib/traversee/store";
import { AvatarInitiales, Btn, Card, Champ, Note, PageHead, Puce, Sur, ui } from "../ui";

type Admin = { id: number; email: string; nom: string; depuis: string };
type Membre = { email: string; nom: string };

const initial: AjoutState = { error: null, message: null };

export function AdminAdministrateurs({ moi, admins, membres }: { moi: number; admins: Admin[]; membres: Membre[] }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(ajouterAdmin, initial);
  const [aConfirmer, setAConfirmer] = useState<number | null>(null);
  const [retrait, setRetrait] = useState<number | null>(null);

  async function retirer(admin: Admin) {
    setRetrait(admin.id);
    const { error } = await retirerAdmin(admin.id);
    setRetrait(null);
    setAConfirmer(null);
    if (error) return toast(error);
    toast(`${admin.nom} n’est plus administrateur.`);
    router.refresh();
  }

  return (
    <>
      <PageHead title="Équipe" accent="administrateurs" text="Les comptes qui ont accès au back-office. Ajoutez un collègue ou retirez des droits." photo="equipe">
        <Puce tone="white">
          {admins.length} administrateur{admins.length > 1 ? "s" : ""}
        </Puce>
      </PageHead>

      <div className={ui.gLarge}>
        <Card pad bleed>
          <Sur>Administrateurs</Sur>
          <ul className={ui.liste}>
            {admins.map((a) => (
              <li key={a.id} className="flex-wrap">
                <AvatarInitiales nom={a.nom} size={40} />
                <div className="min-w-0 flex-1">
                  <strong>
                    {a.nom} {a.id === moi ? <Puce tone="grey">Vous</Puce> : null}
                  </strong>
                  <small>
                    {a.email} · compte créé le {new Date(a.depuis).toLocaleDateString("fr-FR")}
                  </small>
                </div>
                {a.id === moi ? null : aConfirmer === a.id ? (
                  <div className="flex gap-2">
                    <Btn small variant="primary" onClick={() => retirer(a)} disabled={retrait === a.id}>
                      {retrait === a.id ? "Retrait…" : "Confirmer"}
                    </Btn>
                    <Btn small onClick={() => setAConfirmer(null)} disabled={retrait === a.id}>
                      Annuler
                    </Btn>
                  </div>
                ) : (
                  <Btn small variant="ghost" onClick={() => setAConfirmer(a.id)}>
                    Retirer les droits
                  </Btn>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <Card pad bleed>
          <Sur>Ajouter un administrateur</Sur>
          <form action={formAction} className="grid gap-3.5">
            <Champ label="Adresse e-mail" htmlFor="admin-email" hint="Un membre déjà inscrit devient administrateur. Sinon, un compte est créé avec les informations ci-dessous.">
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
            <Champ label="Mot de passe provisoire" htmlFor="admin-mdp" hint="8 caractères minimum, seulement pour un nouveau compte.">
              <input id="admin-mdp" name="password" type="text" className={ui.saisie} autoComplete="new-password" />
            </Champ>
            {state.error ? <Note tone="red">{state.error}</Note> : null}
            {state.message ? <Note tone="green">{state.message}</Note> : null}
            <Btn type="submit" variant="primary" disabled={pending}>
              <UserPlusIcon width={16} height={16} />
              {pending ? "Ajout…" : "Ajouter l’administrateur"}
            </Btn>
          </form>
        </Card>
      </div>
    </>
  );
}
