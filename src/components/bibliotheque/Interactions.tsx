"use client";

import { useState, useTransition } from "react";
import { ArrowRightIcon, CheckIcon, SpinnerIcon } from "@/components/app/icons";
import { Btn } from "@/components/traversee/ui";
import { terminerRessource } from "@/app/(app)/ressources/actions";
import styles from "./bibliotheque.module.css";

export function BoutonTerminer({ id, dejaLue, suivante }: { id: string; dejaLue: boolean; suivante: { href: string; titre: string } | null }) {
  const [lue, setLue] = useState(dejaLue);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  if (lue) {
    return (
      <div className={`${styles.terminer} ${styles.termine}`} role="status">
        <p className="inline-flex items-center gap-2">
          <CheckIcon width={18} height={18} strokeWidth={3} />
          Étape terminée
        </p>
        {suivante ? (
          <Btn variant="navy" href={suivante.href}>
            Étape suivante
            <ArrowRightIcon width={16} height={16} />
          </Btn>
        ) : null}
      </div>
    );
  }

  return (
    <div className={styles.terminer}>
      <p>{erreur ?? "Vous avez fini cette ressource ? Marquez l’étape comme terminée."}</p>
      <Btn
        variant="primary"
        disabled={enCours}
        onClick={() =>
          demarrer(async () => {
            const r = await terminerRessource(id);
            if (r.ok) setLue(true);
            else setErreur(r.message);
          })
        }
      >
        {enCours ? <SpinnerIcon width={16} height={16} className="animate-spin" /> : <CheckIcon width={16} height={16} />}
        Terminer
      </Btn>
    </div>
  );
}
