"use client";

import { useEffect, useState } from "react";
import { PlusIcon } from "@/components/app/icons";
import { CRENEAUX, LIEUX } from "@/lib/traversee/data";
import { setTraversee, toast, uid, useTraversee, type Rdv as RdvType } from "@/lib/traversee/store";
import { Btn, Card, Note, PageHead, Puce, Stat, Vide, ui } from "../ui";
import { RdvModal, occupeMoi } from "./RdvModal";
import styles from "./annuaire.module.css";

const H48 = 48 * 3600 * 1000;

function reste(r: RdvType) {
  const m = Math.max(0, Math.floor((H48 - (Date.now() - r.t)) / 60000));
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`;
}

function Quand({ ci }: { ci: number }) {
  return (
    <div className={styles.quand}>
      <b>{CRENEAUX[ci]}</b>
      <small>18 décembre</small>
    </div>
  );
}

export function Rdv() {
  const s = useTraversee();
  const [modal, setModal] = useState<{ nom: string; confirmer?: boolean; demandeId?: string } | null>(null);

  useEffect(() => {
    const expires = s.rdv.filter((r) => r.etat === "attente" && Date.now() - r.t > H48);
    if (expires.length) setTraversee((st) => ({ rdv: st.rdv.map((r) => (r.etat === "attente" && Date.now() - r.t > H48 ? { ...r, etat: "expire" } : r)) }));
  }, [s.rdv]);

  const confirmes = s.rdv.filter((r) => r.etat === "confirme");
  const envoyees = s.rdv.filter((r) => r.etat !== "confirme");
  const attente = envoyees.filter((r) => r.etat === "attente");
  const pro = confirmes[0];

  function maj(id: string, patch: Partial<RdvType>) {
    setTraversee((st) => ({ rdv: st.rdv.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  }

  function retirer(id: string, msg: string) {
    setTraversee((st) => ({ rdv: st.rdv.filter((r) => r.id !== id) }));
    toast(msg);
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
        Quand vous envoyez une demande, l’heure et l’emplacement vous sont réservés pendant 48 heures. Le rendez-vous est confirmé dès que votre interlocuteur valide. Sans réponse sous 48 heures, l’emplacement est libéré. Pour une demande reçue, vous pouvez valider l’heure proposée, décliner, ou envoyer un message pour demander un changement.
      </Note>
      <div className={`${ui.g4} mb-5`}>
        <Stat label="Confirmés" value={confirmes.length} text="rendez-vous" />
        <Stat label="Envoyées" value={attente.length} text="en attente de validation" />
        <Stat label="Reçues" value={s.demandes.length} text="à valider par vous" />
        <Stat label="Prochain" value={pro ? CRENEAUX[pro.ci] : "—"} text={pro ? `${pro.avec} · ${LIEUX[pro.li].nom}` : "Aucun rendez-vous confirmé"} />
      </div>

      <h2 className="mb-3 font-display text-[18px] text-graphite">Rendez-vous confirmés</h2>
      <div className="mb-6 grid gap-4">
        {confirmes.length ? (
          confirmes.map((r) => (
            <Card key={r.id} bleed className={styles.rdvC}>
              <Quand ci={r.ci} />
              <div className="min-w-0">
                <h3>{r.avec}</h3>
                <p>{LIEUX[r.li].nom} · 20 minutes</p>
                <div className="mt-1.5">
                  <Puce tone="green">Confirmé</Puce>
                </div>
              </div>
              <div className={styles.rdvAct}>
                <Btn small href="/messages">
                  Envoyer un message
                </Btn>
                <Btn small onClick={() => retirer(r.id, "Rendez-vous annulé.")}>
                  Annuler
                </Btn>
              </div>
              <textarea
                defaultValue={r.note ?? ""}
                placeholder="Vos notes après le rendez-vous : besoins, suite à donner…"
                aria-label={`Notes sur le rendez-vous avec ${r.avec}`}
                onBlur={(e) => {
                  if (e.target.value !== (r.note ?? "")) {
                    maj(r.id, { note: e.target.value });
                    toast("Note enregistrée.");
                  }
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
                <h3>{r.avec}</h3>
                <p>{LIEUX[r.li].nom} · 20 minutes</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {r.etat === "attente" ? (
                    <>
                      <Puce tone="red">En attente de validation</Puce>
                      <Puce tone="grey">Emplacement réservé encore {reste(r)}</Puce>
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
                    <Btn small href="/messages">
                      Envoyer un message
                    </Btn>
                    <Btn small onClick={() => retirer(r.id, "Demande retirée.")}>
                      Annuler la demande
                    </Btn>
                    <Btn
                      small
                      variant="navy"
                      onClick={() => {
                        maj(r.id, { etat: "confirme" });
                        toast(`${r.avec} a validé : rendez-vous confirmé.`);
                      }}
                    >
                      Simuler : validée
                    </Btn>
                    <Btn
                      small
                      onClick={() => {
                        maj(r.id, { etat: "decline" });
                        toast(`${r.avec} a décliné : emplacement libéré.`);
                      }}
                    >
                      Simuler : déclinée
                    </Btn>
                  </>
                ) : (
                  <>
                    <Btn small variant="primary" onClick={() => setModal({ nom: r.avec })}>
                      Proposer un autre créneau
                    </Btn>
                    <Btn small onClick={() => retirer(r.id, "Demande retirée.")}>
                      Retirer
                    </Btn>
                  </>
                )}
              </div>
            </Card>
          ))
        ) : (
          <Vide>Vous n’avez envoyé aucune demande. Réservez un créneau depuis l’annuaire ou depuis votre table.</Vide>
        )}
      </div>

      <h2 className="mb-3 font-display text-[18px] text-graphite">
        Demandes reçues <Puce tone="grey">exemple</Puce>
      </h2>
      <div className="grid gap-4">
        {s.demandes.length ? (
          s.demandes.map((d) => (
            <Card key={d.id} bleed className={styles.rdvC}>
              <Quand ci={d.ci} />
              <div className="min-w-0">
                <h3>{d.avec}</h3>
                <p>
                  Vous propose {CRENEAUX[d.ci]}, {LIEUX[d.li].nom} · 20 minutes
                </p>
                <div className="mt-1.5">
                  <Puce tone="red">En attente de votre réponse</Puce>
                </div>
              </div>
              <div className={styles.rdvAct}>
                <Btn
                  small
                  variant="primary"
                  onClick={() => {
                    if (occupeMoi(s, d.ci)) return toast(`Vous avez déjà un rendez-vous à ${CRENEAUX[d.ci]}. Envoyez un message pour changer l’heure.`);
                    setTraversee((st) => ({
                      rdv: [...st.rdv, { id: uid("r"), avec: d.avec, ci: d.ci, li: d.li, etat: "confirme" as const, t: Date.now() }].sort((a, b) => a.ci - b.ci),
                      demandes: st.demandes.filter((x) => x.id !== d.id),
                    }));
                    toast(`Rendez-vous confirmé à ${CRENEAUX[d.ci]}, ${LIEUX[d.li].nom}.`);
                  }}
                >
                  Valider
                </Btn>
                <Btn small href="/messages">
                  Envoyer un message
                </Btn>
                <Btn small onClick={() => setModal({ nom: d.avec, confirmer: true, demandeId: d.id })}>
                  Autre créneau
                </Btn>
                <Btn
                  small
                  onClick={() => {
                    setTraversee((st) => ({ demandes: st.demandes.filter((x) => x.id !== d.id) }));
                    toast("Demande déclinée.");
                  }}
                >
                  Décliner
                </Btn>
              </div>
            </Card>
          ))
        ) : (
          <Vide>Aucune demande en attente.</Vide>
        )}
      </div>
      {modal ? <RdvModal nom={modal.nom} confirmer={modal.confirmer} demandeId={modal.demandeId} onClose={() => setModal(null)} /> : null}
    </>
  );
}
