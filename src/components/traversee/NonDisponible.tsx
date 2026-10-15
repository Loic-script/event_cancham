import type { ReactNode } from "react";
import { ArrowLeftIcon, ClockIcon } from "@/components/app/icons";
import { Btn } from "./ui";
import styles from "./nonDisponible.module.css";

type Props = { titre: string; texte: string; icone: ReactNode; retour?: string };

export function NonDisponible({ titre, texte, icone, retour = "/" }: Props) {
  return (
    <section className={styles.cadre} aria-labelledby="nd-titre">
      <div className={styles.halo} aria-hidden />
      <span className={styles.icone} aria-hidden>
        {icone}
        <i>
          <ClockIcon width={14} height={14} />
        </i>
      </span>
      <p className={styles.badge}>Non disponible</p>
      <h1 id="nd-titre">{titre}</h1>
      <p className={styles.texte}>{texte}</p>
      <Btn variant="navy" href={retour}>
        <ArrowLeftIcon width={16} height={16} />
        Retour à l’accueil
      </Btn>
    </section>
  );
}
