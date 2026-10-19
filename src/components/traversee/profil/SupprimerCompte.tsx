"use client";

import { useActionState, useState } from "react";
import { supprimerMonCompte, type SuppressionState } from "@/app/(app)/profil/actions";
import { useSessionIdentity } from "@/components/profile/useProfile";
import { Btn, Card, Note, Sur, ui } from "../ui";

const MOT = "SUPPRIMER";
const initial: SuppressionState = { error: null };

/** Zone « Supprimer mon compte » du profil : confirmation en tapant SUPPRIMER. Absente pour le super admin. */
export function SupprimerCompte() {
  const identite = useSessionIdentity();
  const [state, action, pending] = useActionState(supprimerMonCompte, initial);
  const [ouvert, setOuvert] = useState(false);
  const [saisie, setSaisie] = useState("");
  if (!identite || identite.superAdmin) return null;
  const pret = saisie.trim().toUpperCase() === MOT;

  function oublierCeNavigateur() {
    // Les données gardées dans ce navigateur (profil, défis, publications locales) partent avec le compte.
    try {
      window.localStorage.removeItem("traversee.v1");
      window.localStorage.removeItem(`event.profile.v1.u${identite?.id}`);
    } catch {
      /* stockage indisponible : rien à effacer */
    }
  }

  return (
    <Card pad bleed className="mt-4 grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Sur className="!mb-1.5">Supprimer mon compte</Sur>
          <p className="text-graphite-muted">Votre compte, votre profil, vos publications, commentaires, j’aime et inscriptions au programme sont effacés définitivement.</p>
        </div>
        {ouvert ? null : (
          <Btn variant="light" onClick={() => setOuvert(true)}>
            Supprimer mon compte
          </Btn>
        )}
      </div>
      {ouvert ? (
        <form action={action} onSubmit={oublierCeNavigateur} className="grid gap-3">
          <Note tone="red">Cette action est irréversible : pour revenir, il faudra créer un nouveau compte et attendre sa validation.</Note>
          <label className="grid gap-1.5 text-[13.5px] font-semibold text-graphite" htmlFor="suppr-confirmation">
            Tapez {MOT} pour confirmer
            <input id="suppr-confirmation" name="confirmation" className={ui.saisie} value={saisie} onChange={(e) => setSaisie(e.target.value)} autoComplete="off" autoCapitalize="characters" spellCheck={false} />
          </label>
          {state.error ? <Note tone="red">{state.error}</Note> : null}
          <div className="flex flex-wrap gap-2.5">
            <Btn variant="primary" type="submit" disabled={!pret || pending}>
              {pending ? "Suppression…" : "Supprimer définitivement"}
            </Btn>
            <Btn
              onClick={() => {
                setOuvert(false);
                setSaisie("");
              }}
              disabled={pending}
            >
              Annuler
            </Btn>
          </div>
        </form>
      ) : null}
    </Card>
  );
}
