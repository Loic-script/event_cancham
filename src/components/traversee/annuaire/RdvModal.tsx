"use client";

import { useState } from "react";
import { CRENEAUX, LIEUX, creneauPrisParDefaut } from "@/lib/traversee/data";
import { setTraversee, toast, uid, useTraversee, type TraverseeState } from "@/lib/traversee/store";
import { Modal } from "../Modal";
import { Btn, Champ, Sur, ui } from "../ui";
import styles from "./annuaire.module.css";

export function pris(s: TraverseeState, ci: number, li: number) {
  return creneauPrisParDefaut(ci, li) || s.rdv.some((r) => r.ci === ci && r.li === li && (r.etat === "confirme" || r.etat === "attente"));
}

export function occupeMoi(s: TraverseeState, ci: number) {
  return s.rdv.some((r) => r.ci === ci && (r.etat === "confirme" || r.etat === "attente"));
}

type RdvModalProps = { nom: string; onClose: () => void; confirmer?: boolean; demandeId?: string };

export function RdvModal({ nom, onClose, confirmer = false, demandeId }: RdvModalProps) {
  const s = useTraversee();
  const [ci, setCi] = useState<number | null>(null);
  const [li, setLi] = useState<number | null>(null);

  function envoyer() {
    if (ci === null || li === null) return;
    setTraversee((st) => ({
      rdv: [...st.rdv.filter((r) => !(r.avec === nom && (r.etat === "decline" || r.etat === "expire"))), { id: uid("r"), avec: nom, ci, li, etat: confirmer ? ("confirme" as const) : ("attente" as const), t: Date.now() }].sort((a, b) => a.ci - b.ci),
      demandes: demandeId ? st.demandes.filter((d) => d.id !== demandeId) : st.demandes,
    }));
    toast(confirmer ? `Rendez-vous confirmé à ${CRENEAUX[ci]}, ${LIEUX[li].nom}.` : "Demande envoyée. L’emplacement vous est réservé 48 heures.");
    onClose();
  }

  return (
    <Modal onClose={onClose} label={`Rendez-vous avec ${nom}`} size="large">
      <div>
        <Sur>Rendez-vous B2B · 18 décembre</Sur>
        <h3 className="font-display text-[20px] text-graphite">{nom}</h3>
        <p className="text-graphite-muted">Vingt minutes, sur l’un des trois emplacements dédiés. L’emplacement vous est réservé 48 heures, le temps que votre interlocuteur valide. Créneaux d’exemple.</p>
      </div>
      <Champ label="Heure" htmlFor="r-heure">
        <select
          id="r-heure"
          className={ui.saisie}
          value={ci ?? ""}
          onChange={(e) => {
            setCi(e.target.value === "" ? null : Number(e.target.value));
            setLi(null);
          }}
        >
          <option value="">Choisir une heure…</option>
          {CRENEAUX.map((c, i) => {
            const plein = [0, 1, 2].every((l) => pris(s, i, l));
            const moi = occupeMoi(s, i);
            return (
              <option key={c} value={i} disabled={plein || moi}>
                {c}
                {moi ? " · vous avez déjà un rendez-vous" : plein ? " · complet" : ""}
              </option>
            );
          })}
        </select>
      </Champ>
      <div>
        <Sur>Emplacement</Sur>
        {ci === null ? (
          <p className="text-graphite-muted">Choisissez d’abord une heure.</p>
        ) : (
          <div className={styles.lieux}>
            {LIEUX.map((l, i) => {
              const p = pris(s, ci, i);
              return (
                <button key={l.nom} type="button" className={`${styles.lieu} ${li === i && !p ? styles.lieuOn : ""}`} disabled={p} onClick={() => setLi(i)}>
                  <strong>{l.nom}</strong>
                  <small>{p ? "Déjà réservé" : "Libre"}</small>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2.5">
        <Btn variant="primary" disabled={ci === null || li === null} onClick={envoyer}>
          {confirmer ? "Confirmer ce rendez-vous" : "Envoyer la demande"}
        </Btn>
        <Btn onClick={onClose}>Annuler</Btn>
      </div>
    </Modal>
  );
}
