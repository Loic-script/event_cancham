"use client";

import { DownloadIcon } from "@/components/app/icons";
import { useProfile, useSessionIdentity } from "@/components/profile/useProfile";
import { QrCode } from "@/components/ticket/QrCode";
import { LIEU_LONG, LOGO_BLANC } from "@/lib/traversee/data";
import { useTraversee } from "@/lib/traversee/store";
import { fullName } from "@/lib/mock/data";
import { Modal } from "../Modal";
import { Btn, Puce, Sur } from "../ui";
import { profilComplet } from "../defis/DefiPitch";
import styles from "./achats.module.css";

export function BilletCard() {
  const me = useProfile();
  const identite = useSessionIdentity();
  const { table, siege } = useTraversee();
  return (
    <div className={styles.billet}>
      <div className={styles.bt}>
        <small>Billet · La Traversée</small>
        <strong>Gala des 10 ans de la CanCham</strong>
        <span>Vendredi 18 décembre 2026 · {LIEU_LONG}</span>
        <img src={LOGO_BLANC} alt="IMPACT 261" />
      </div>
      <div className={styles.bc}>
        {identite ? <QrCode value={identite.codeBillet} size={140} /> : null}
        <div className={styles.bInfos}>
          <Sur className="!mb-1.5">Participant</Sur>
          <h3 className="font-display text-[22px] text-graphite">{fullName(me)}</h3>
          <p className="font-semibold text-graphite">{me.company || "Entreprise à renseigner"}</p>
          <p className="text-graphite-muted">{me.role || "Rôle à renseigner"}</p>
          {identite ? <p className="mt-1.5 font-mono text-[12px] tracking-[0.12em] text-graphite-muted">{identite.codeBillet}</p> : null}
          {identite && !identite.billetPaye ? (
            <p className="mt-2.5">
              <Puce tone="red">Paiement en attente</Puce>
            </p>
          ) : null}
          {table ? (
            <p className="mt-2.5">
              <Puce>
                Table {table} · chaise {(siege ?? 0) + 1}
              </Puce>
            </p>
          ) : null}
        </div>
        <span className={styles.bPhoto}>
          {me.photo ? (
            <img src={me.photo} alt={`Photo de ${fullName(me)}`} />
          ) : (
            <svg viewBox="0 0 64 64" aria-hidden>
              <circle cx="32" cy="24" r="11" fill="#f4f6f8" />
              <ellipse cx="32" cy="62" rx="24" ry="22" fill="#f4f6f8" />
            </svg>
          )}
        </span>
      </div>
    </div>
  );
}

export function BilletModal({ onClose }: { onClose: () => void }) {
  const me = useProfile();
  return (
    <Modal onClose={onClose} label="Mon billet" size="large">
      <BilletCard />
      <div className="flex flex-wrap gap-2">
        <Btn variant="primary" href="/billet">
          <DownloadIcon width={16} height={16} />
          Afficher et télécharger
        </Btn>
        {!profilComplet(me) ? (
          <Btn href="/profil">Compléter mon profil</Btn>
        ) : null}
        <Btn onClick={onClose}>Fermer</Btn>
      </div>
    </Modal>
  );
}
