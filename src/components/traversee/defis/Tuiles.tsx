import { IMG } from "@/lib/traversee/data";
import styles from "./defis.module.css";

export type DefiType = "pitch" | "tombola";

export function GainPitch() {
  return (
    <div className={`${styles.gain} m-bleed`}>
      <img src={IMG("pitch")} alt="" />
      <div>
        <p className={styles.lot}>Un mois au Canada</p>
        <p>Une MECC 2027 complète, tous frais payés, pour le grand gagnant.</p>
        <ul className={styles.inclus}>
          {["Participation à la MECC 2027", "Billet d’avion", "Hébergement", "Transport", "Restauration", "Accompagnement visa", "Formation Doing Business in Canada"].map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function GainTombola() {
  return (
    <div className={`${styles.gain} m-bleed`}>
      <img src={IMG("equipe")} alt="" />
      <div>
        <p className={styles.lot}>3 000 000 Ar</p>
        <p>L’équivalent de 1 000 CAD. Le participant dont la publication compte le plus de réactions à la fin du vote, pendant l’événement, est le grand gagnant.</p>
        <ul className={styles.inclus}>
          {["Le plus de réactions l’emporte", "Clôture à la fin du vote, le 18 décembre", "Aucun pitch à préparer"].map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
