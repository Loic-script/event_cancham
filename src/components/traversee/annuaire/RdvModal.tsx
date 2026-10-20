"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { chargerDisponibilites, demanderRdv } from "@/app/(app)/rdv/actions";
import type { Disponibilites } from "@/lib/rendezvous";
import { CRENEAUX, LIEUX } from "@/lib/traversee/data";
import { toast } from "@/lib/traversee/store";
import { Modal } from "../Modal";
import { Btn, Champ, Note, Sur, ui } from "../ui";
import styles from "./annuaire.module.css";

type RdvModalProps = {
  avec: { id: number; nom: string; ent?: string };
  /** Demande reçue à laquelle on propose un autre créneau, ou ancienne demande que l'on renouvelle. */
  remplace?: string;
  onClose: () => void;
};

/** Demande de rendez-vous B2B : créneaux et emplacements réellement libres pour les deux participants. */
export function RdvModal({ avec, remplace, onClose }: RdvModalProps) {
  const router = useRouter();
  const [dispo, setDispo] = useState<Disponibilites | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [ci, setCi] = useState<number | null>(null);
  const [li, setLi] = useState<number | null>(null);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    let actif = true;
    void chargerDisponibilites(avec.id, remplace).then((r) => {
      if (!actif) return;
      if (r.error || !r.dispo) setErreur(r.error ?? "Disponibilités indisponibles.");
      else setDispo(r.dispo);
    });
    return () => {
      actif = false;
    };
  }, [avec.id, remplace]);

  const pris = (c: number, l: number) => Boolean(dispo?.pris.some(([a, b]) => a === c && b === l));
  const titre = avec.ent ? `${avec.nom} · ${avec.ent}` : avec.nom;

  async function envoyer() {
    if (ci === null || li === null || envoi) return;
    setEnvoi(true);
    const { error } = await demanderRdv(avec.id, ci, li, remplace);
    setEnvoi(false);
    if (error) return toast(error);
    toast(`Demande envoyée à ${avec.nom} : ${CRENEAUX[ci]}, ${LIEUX[li].nom}. L’emplacement vous est réservé 48 heures.`);
    router.refresh();
    onClose();
  }

  return (
    <Modal onClose={onClose} label={`Rendez-vous avec ${avec.nom}`} size="large">
      <div>
        <Sur>Rendez-vous B2B · 18 décembre</Sur>
        <h3 className="font-display text-[20px] text-graphite">{titre}</h3>
        <p className="text-graphite-muted">Vingt minutes, sur l’un des trois emplacements dédiés. L’emplacement vous est réservé 48 heures, le temps que {avec.nom} valide.</p>
      </div>
      {erreur ? <Note tone="red">{erreur}</Note> : null}
      <Champ label="Heure" htmlFor="r-heure">
        <select
          id="r-heure"
          className={ui.saisie}
          value={ci ?? ""}
          disabled={!dispo}
          onChange={(e) => {
            setCi(e.target.value === "" ? null : Number(e.target.value));
            setLi(null);
          }}
        >
          <option value="">{dispo ? "Choisir une heure…" : "Chargement des disponibilités…"}</option>
          {CRENEAUX.map((c, i) => {
            const moi = dispo?.moiOccupe.includes(i);
            const lui = dispo?.autreOccupe.includes(i);
            const plein = LIEUX.every((_, l) => pris(i, l));
            return (
              <option key={c} value={i} disabled={moi || lui || plein}>
                {c}
                {moi ? " · vous avez déjà un rendez-vous" : lui ? ` · ${avec.nom} n’est pas disponible` : plein ? " · complet" : ""}
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
              const p = pris(ci, i);
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
        <Btn variant="primary" disabled={ci === null || li === null || envoi} onClick={() => void envoyer()}>
          {envoi ? "Envoi…" : "Envoyer la demande"}
        </Btn>
        <Btn onClick={onClose}>Annuler</Btn>
      </div>
    </Modal>
  );
}
