"use client";

import { useState, useTransition } from "react";
import { ArrowRightIcon, CheckIcon, LockIcon, MailIcon, SpinnerIcon } from "@/components/app/icons";
import { Btn } from "@/components/traversee/ui";
import { demarrerAchat, terminerRessource } from "@/app/(app)/ressources/actions";
import type { Moyen } from "@/lib/paiement/prestataire";
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

export function CarteAchat({ id, prix, moyens, contact }: { id: string; prix: string; moyens: Moyen[]; contact: string }) {
  const [moyen, setMoyen] = useState(moyens[0]?.id ?? "");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  return (
    <section className={styles.achat} aria-labelledby="achat-titre">
      <div className={styles.achatTete}>
        <span className={styles.achatIco}>
          <LockIcon width={24} height={24} />
        </span>
        <div>
          <small id="achat-titre">Ressource payante</small>
          <strong>{prix}</strong>
        </div>
      </div>
      {moyens.length ? (
        <>
          <p className="text-[14.5px] text-graphite-muted">L’achat ouvre la ressource à toute votre entreprise. Choisissez votre moyen de paiement :</p>
          <div className={styles.moyens} role="radiogroup" aria-label="Moyen de paiement">
            {moyens.map((m) => (
              <button key={m.id} type="button" role="radio" aria-checked={moyen === m.id} className={`${styles.moyen} ${moyen === m.id ? styles.moyenOn : ""}`} onClick={() => setMoyen(m.id)}>
                <i aria-hidden />
                {m.libelle}
              </button>
            ))}
          </div>
          {erreur ? <p className="text-[13.5px] font-semibold text-leaf-ink">{erreur}</p> : null}
          <div>
            <Btn
              variant="primary"
              disabled={!moyen || enCours}
              onClick={() =>
                demarrer(async () => {
                  const r = await demarrerAchat(id, moyen);
                  if (r.ok && r.url) window.location.assign(r.url);
                  else if (!r.ok) setErreur(r.message);
                })
              }
            >
              {enCours ? <SpinnerIcon width={16} height={16} className="animate-spin" /> : <LockIcon width={16} height={16} />}
              Payer {prix}
            </Btn>
          </div>
        </>
      ) : (
        <>
          <p className="text-[14.5px] leading-relaxed text-graphite-muted">Cette ressource n’est pas encore ouverte pour votre entreprise. Le paiement en ligne n’est pas disponible : l’équipe CanCham peut vous ouvrir l’accès.</p>
          <div>
            <Btn variant="navy" href={contact}>
              <MailIcon width={16} height={16} />
              Écrire à l’équipe
            </Btn>
          </div>
        </>
      )}
    </section>
  );
}
