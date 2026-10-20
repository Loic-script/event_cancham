"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PlusIcon } from "@/components/app/icons";
import { annulerRdv, noterRdv, repondreRdv } from "@/app/(app)/rdv/actions";
import type { RdvVue } from "@/lib/rendezvous";
import { CRENEAUX, LIEUX } from "@/lib/traversee/data";
import { toast } from "@/lib/traversee/store";
import { Btn, Card, Note, PageHead, Puce, Stat, Vide, ui } from "../ui";
import { RdvModal } from "./RdvModal";
import styles from "./annuaire.module.css";

// Heure de Madagascar : le serveur et le navigateur affichent la même échéance.
const ECHEANCE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Indian/Antananarivo" });

function Quand({ ci }: { ci: number }) {
  return (
    <div className={styles.quand}>
      <b>{CRENEAUX[ci]}</b>
      <small>18 décembre</small>
    </div>
  );
}

const avecQui = (r: RdvVue) => (r.avec.ent ? `${r.avec.nom} · ${r.avec.ent}` : r.avec.nom);

export function Rdv({ rdv }: { rdv: RdvVue[] }) {
  const router = useRouter();
  const [modal, setModal] = useState<{ avec: RdvVue["avec"]; remplace?: string } | null>(null);
  const [occupe, setOccupe] = useState<string | null>(null);

  const confirmes = rdv.filter((r) => r.etat === "confirme");
  const envoyees = rdv.filter((r) => r.sens === "envoye" && r.etat !== "confirme");
  const recues = rdv.filter((r) => r.sens === "recu" && r.etat === "attente");
  const attente = envoyees.filter((r) => r.etat === "attente");
  const pro = confirmes[0];

  async function agir(r: RdvVue, action: () => Promise<{ error: string | null }>, ok: string) {
    setOccupe(r.id);
    const { error } = await action();
    setOccupe(null);
    if (error) return toast(error);
    toast(ok);
    router.refresh();
  }

  return (
    <>
      <PageHead title="Mes" accent="rendez-vous" text="Vos demandes envoyées, celles que vous recevez et vos rendez-vous confirmés pour le 18 décembre." photo="rdv">
        <Btn variant="primary" href="/annuaire">
          <PlusIcon width={16} height={16} />
          Demander un rendez-vous
        </Btn>
      </PageHead>
      <Note className="mb-4">
        Quand vous envoyez une demande, l’heure et l’emplacement vous sont réservés pendant 48 heures. Le rendez-vous est confirmé dès que votre interlocuteur valide. Sans réponse sous 48 heures, l’emplacement est libéré. Pour une demande reçue, vous pouvez valider, décliner, ou proposer un autre créneau.
      </Note>
      <div className={`${ui.g4} mb-5`}>
        <Stat label="Confirmés" value={confirmes.length} text="rendez-vous" />
        <Stat label="Envoyées" value={attente.length} text="en attente de validation" />
        <Stat label="Reçues" value={recues.length} text="à valider par vous" />
        <Stat label="Prochain" value={pro ? CRENEAUX[pro.ci] : "—"} text={pro ? `${pro.avec.nom} · ${LIEUX[pro.li].nom}` : "Aucun rendez-vous confirmé"} />
      </div>

      <h2 className="mb-3 font-display text-[18px] text-graphite">Rendez-vous confirmés</h2>
      <div className="mb-6 grid gap-4">
        {confirmes.length ? (
          confirmes.map((r) => (
            <Card key={r.id} bleed className={styles.rdvC}>
              <Quand ci={r.ci} />
              <div className="min-w-0">
                <h3>{avecQui(r)}</h3>
                <p>{LIEUX[r.li].nom} · 20 minutes</p>
                <div className="mt-1.5">
                  <Puce tone="green">Confirmé</Puce>
                </div>
              </div>
              <div className={styles.rdvAct}>
                <Btn small href={`/messages/avec/${r.avec.id}`}>
                  Envoyer un message
                </Btn>
                <Btn small className="!text-[#b42318]" disabled={occupe === r.id} onClick={() => void agir(r, () => annulerRdv(r.id), `Rendez-vous avec ${r.avec.nom} annulé : l’emplacement est libéré.`)}>
                  Annuler
                </Btn>
              </div>
              <textarea
                defaultValue={r.note}
                maxLength={1000}
                placeholder="Vos notes après le rendez-vous : besoins, suite à donner… (visibles par vous seul)"
                aria-label={`Notes sur le rendez-vous avec ${r.avec.nom}`}
                onBlur={async (e) => {
                  if (e.target.value.trim() === r.note) return;
                  const { error } = await noterRdv(r.id, e.target.value);
                  toast(error ?? "Note enregistrée.");
                }}
              />
            </Card>
          ))
        ) : (
          <Vide>Aucun rendez-vous confirmé pour l’instant.</Vide>
        )}
      </div>

      <h2 className="mb-3 font-display text-[18px] text-graphite">Demandes envoyées</h2>
      <div className="mb-6 grid gap-4">
        {envoyees.length ? (
          envoyees.map((r) => (
            <Card key={r.id} bleed className={styles.rdvC}>
              <Quand ci={r.ci} />
              <div className="min-w-0">
                <h3>{avecQui(r)}</h3>
                <p>{LIEUX[r.li].nom} · 20 minutes</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {r.etat === "attente" ? (
                    <>
                      <Puce tone="red">En attente de validation</Puce>
                      <Puce tone="grey">Emplacement réservé jusqu’au {ECHEANCE.format(new Date(r.expireLe)).replace(":", " h ")}</Puce>
                    </>
                  ) : r.etat === "decline" ? (
                    <Puce tone="grey">Déclinée · emplacement libéré</Puce>
                  ) : (
                    <Puce tone="grey">Expirée après 48 h · emplacement libéré</Puce>
                  )}
                </div>
              </div>
              <div className={styles.rdvAct}>
                {r.etat === "attente" ? (
                  <>
                    <Btn small href={`/messages/avec/${r.avec.id}`}>
                      Envoyer un message
                    </Btn>
                    <Btn small className="!text-[#b42318]" disabled={occupe === r.id} onClick={() => void agir(r, () => annulerRdv(r.id), "Demande retirée : l’emplacement est libéré.")}>
                      Annuler la demande
                    </Btn>
                  </>
                ) : (
                  <>
                    <Btn small variant="primary" onClick={() => setModal({ avec: r.avec, remplace: r.id })}>
                      Proposer un autre créneau
                    </Btn>
                    <Btn small disabled={occupe === r.id} onClick={() => void agir(r, () => annulerRdv(r.id), "Demande retirée.")}>
                      Retirer
                    </Btn>
                  </>
                )}
              </div>
            </Card>
          ))
        ) : (
          <Vide>Vous n’avez envoyé aucune demande. Réservez un créneau depuis l’annuaire.</Vide>
        )}
      </div>

      <h2 className="mb-3 font-display text-[18px] text-graphite">Demandes reçues</h2>
      <div className="grid gap-4">
        {recues.length ? (
          recues.map((r) => (
            <Card key={r.id} bleed className={styles.rdvC}>
              <Quand ci={r.ci} />
              <div className="min-w-0">
                <h3>{avecQui(r)}</h3>
                <p>
                  Vous propose {CRENEAUX[r.ci]}, {LIEUX[r.li].nom} · 20 minutes
                </p>
                <div className="mt-1.5">
                  <Puce tone="red">En attente de votre réponse</Puce>
                </div>
              </div>
              <div className={styles.rdvAct}>
                <Btn small variant="primary" disabled={occupe === r.id} onClick={() => void agir(r, () => repondreRdv(r.id, "valider"), `Rendez-vous confirmé à ${CRENEAUX[r.ci]}, ${LIEUX[r.li].nom}.`)}>
                  Valider
                </Btn>
                <Btn small href={`/messages/avec/${r.avec.id}`}>
                  Envoyer un message
                </Btn>
                <Btn small onClick={() => setModal({ avec: r.avec, remplace: r.id })}>
                  Autre créneau
                </Btn>
                <Btn small className="!text-[#b42318]" disabled={occupe === r.id} onClick={() => void agir(r, () => repondreRdv(r.id, "decliner"), "Demande déclinée.")}>
                  Décliner
                </Btn>
              </div>
            </Card>
          ))
        ) : (
          <Vide>Aucune demande en attente.</Vide>
        )}
      </div>
      {modal ? <RdvModal avec={modal.avec} remplace={modal.remplace} onClose={() => setModal(null)} /> : null}
    </>
  );
}
