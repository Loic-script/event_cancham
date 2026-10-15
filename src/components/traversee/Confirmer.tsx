"use client";

import type { ReactNode } from "react";
import { SpinnerIcon, TrashIcon } from "@/components/app/icons";
import { Modal } from "./Modal";
import { Btn } from "./ui";
import styles from "./confirmer.module.css";

type ConfirmerProps = {
  titre: string;
  action: string;
  children: ReactNode;
  enCours?: boolean;
  erreur?: string | null;
  onConfirmer: () => void;
  onClose: () => void;
};

export function Confirmer({ titre, action, children, enCours = false, erreur = null, onConfirmer, onClose }: ConfirmerProps) {
  return (
    <Modal onClose={() => (enCours ? undefined : onClose())} label={titre} size="narrow">
      <div className={styles.confirme}>
        <span className={styles.icone}>
          <TrashIcon width={24} height={24} />
        </span>
        <h3>{titre}</h3>
        <div className={styles.texte}>{children}</div>
        {erreur ? (
          <p className={styles.erreur} role="alert">
            {erreur}
          </p>
        ) : null}
        <div className={styles.boutons}>
          <Btn onClick={onClose} disabled={enCours}>
            Annuler
          </Btn>
          <button type="button" className={styles.danger} onClick={onConfirmer} disabled={enCours}>
            {enCours ? <SpinnerIcon width={16} height={16} className="animate-spin" /> : <TrashIcon width={16} height={16} />}
            {action}
          </button>
        </div>
      </div>
    </Modal>
  );
}
