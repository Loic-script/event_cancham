"use client";

import type { ReactNode } from "react";
import { Modal } from "@/components/traversee/Modal";
import { Btn } from "@/components/traversee/ui";

export function Confirmer({ titre, children, action, onConfirmer, onClose, enCours = false }: { titre: string; children: ReactNode; action: string; onConfirmer: () => void; onClose: () => void; enCours?: boolean }) {
  return (
    <Modal onClose={enCours ? () => undefined : onClose} label={titre} size="narrow">
      <h3 className="font-display text-[19px] text-graphite">{titre}</h3>
      <div className="text-[14.5px] leading-relaxed text-graphite-muted">{children}</div>
      <div className="flex flex-wrap gap-2">
        <Btn variant="primary" onClick={onConfirmer} disabled={enCours} className="!bg-[#c0174d] !border-[#c0174d]">
          {action}
        </Btn>
        <Btn onClick={onClose} disabled={enCours}>
          Annuler
        </Btn>
      </div>
    </Modal>
  );
}
