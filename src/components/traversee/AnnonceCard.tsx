"use client";

import Link from "next/link";
import { MegaphoneIcon } from "@/components/app/icons";
import { DESTINATIONS, TYPES_ANNONCE, heureAnn } from "@/lib/traversee/data";
import type { Annonce } from "@/lib/traversee/store";
import { Btn } from "./ui";
import styles from "./annonce.module.css";

type AnnonceCardProps = {
  annonce: Omit<Annonce, "id"> & { id?: string };
  apercu?: boolean;
  onClose?: () => void;
};

export function AnnonceCard({ annonce, apercu = false, onClose }: AnnonceCardProps) {
  const dest = DESTINATIONS.find((d) => d.href === annonce.cta);
  return (
    <div className={`${styles.annonce} ${annonce.type === "urgent" ? styles.urgent : ""} ${apercu ? styles.apercu : ""}`}>
      <div className={styles.bandeau}>
        <MegaphoneIcon width={26} height={26} />
        <div>
          <small>{TYPES_ANNONCE[annonce.type]} · CanCham</small>
          <strong>{annonce.titre || "Titre de l’annonce"}</strong>
        </div>
      </div>
      {annonce.img ? <img className={styles.img} src={annonce.img} alt="" /> : null}
      <div className={styles.corps}>
        <p>{annonce.message || "Votre message apparaît ici."}</p>
        {annonce.t ? <time>{heureAnn(annonce.t)}</time> : null}
        <div className={styles.actions}>
          {dest ? (
            apercu ? (
              <span className={styles.faux}>{dest.label}</span>
            ) : (
              <Link href={dest.href} onClick={onClose} className={styles.lien}>
                {dest.label}
              </Link>
            )
          ) : null}
          <Btn variant="light" onClick={apercu ? undefined : onClose} className="flex-1">
            Fermer
          </Btn>
        </div>
      </div>
    </div>
  );
}
