"use client";

import { useEffect, useState } from "react";
import { reprendreParcours } from "@/app/bienvenue/actions";
import type { EtapeId } from "@/lib/parcours";
import { ArrowRightIcon, UserIcon, XIcon } from "./icons";
import styles from "./rappel.module.css";

/** Ce qui manque, dans les mots du participant. */
const MANQUES: Record<EtapeId, string> = {
  photo: "votre photo de profil",
  entreprise: "votre entreprise et votre fonction",
};

/** Fermé par le participant : on ne le redit pas avant ce délai. */
const CLE = "traversee.rappelProfil.ferme";
const SILENCE_MS = 24 * 3600_000;

function fermeRecemment(): boolean {
  try {
    const t = Number(localStorage.getItem(CLE));
    return Boolean(t) && Date.now() - t < SILENCE_MS;
  } catch {
    return false;
  }
}

/**
 * Rappel en bas de l'espace participant tant que le profil n'est pas complet (photo, entreprise…) :
 * « Compléter » rouvre le parcours d'accueil, la croix le fait taire pour la journée.
 */
export function RappelProfil({ etapes }: { etapes: EtapeId[] }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!etapes.length || fermeRecemment()) return;
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, [etapes.length]);

  if (!visible) return null;

  const manques = etapes.map((e) => MANQUES[e]).filter(Boolean);
  const liste = manques.length > 1 ? `${manques.slice(0, -1).join(", ")} et ${manques[manques.length - 1]}` : (manques[0] ?? "quelques informations");

  function fermer() {
    try {
      localStorage.setItem(CLE, String(Date.now()));
    } catch {}
    setVisible(false);
  }

  return (
    <aside className={styles.rappel} role="status" aria-label="Profil à compléter">
      <span className={styles.icone} aria-hidden>
        <UserIcon />
      </span>
      <div className={styles.texte}>
        <strong>Complétez votre profil</strong>
        <p>Il manque {liste}. Deux minutes suffisent, et votre fiche sera complète dans l’annuaire.</p>
      </div>
      <form action={reprendreParcours}>
        <button type="submit" className={styles.completer}>
          Compléter
          <ArrowRightIcon width={16} height={16} />
        </button>
      </form>
      <button type="button" className={styles.fermer} onClick={fermer} aria-label="Plus tard">
        <XIcon width={18} height={18} />
      </button>
    </aside>
  );
}
