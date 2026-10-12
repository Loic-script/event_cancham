import Link from "next/link";
import { IMG } from "@/lib/traversee/data";
import styles from "./defis.module.css";

export type DefiType = "pitch" | "tombola";

export function Tuiles({ actif, admin = false }: { actif: DefiType; admin?: boolean }) {
  const base = admin ? "/admin/defis" : "/defis";
  const tuiles: { v: DefiType; num: number; nom: string; lot: string; sous: string; img: string }[] = [
    { v: "pitch", num: 1, nom: "Gagnez un voyage au Canada", lot: "Un mois au Canada", sous: "Vote du public, finale au Gala", img: "pitch" },
    { v: "tombola", num: 2, nom: "Gagnez 3 000 000 Ar", lot: "3 000 000 Ar", sous: "Le plus de réactions l’emporte", img: "equipe" },
  ];
  return (
    <div className={styles.choix}>
      {tuiles.map((t) => {
        const on = t.v === actif;
        return (
          <Link key={t.v} href={`${base}/${t.v}`} aria-current={on ? "page" : undefined} className={`${styles.tuile} ${on ? styles.tuileOn : ""}`}>
            <img src={IMG(t.img)} alt="" />
            <span className={styles.t}>
              <small>
                Défi {t.num} · {t.nom}
              </small>
              <strong>{t.lot}</strong>
              <em>{t.sous}</em>
            </span>
            <span className={styles.etat}>{on ? "Affiché ci-dessous" : "Voir ce défi →"}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function GainPitch() {
  return (
    <div className={`${styles.gain} rounded-[14px] border border-line bg-surface shadow-[0_1px_2px_rgba(15,29,44,0.05),0_12px_28px_-18px_rgba(15,29,44,0.25)] m-bleed`}>
      <img src={IMG("pitch")} alt="" />
      <div>
        <p className={styles.lot}>Un mois au Canada</p>
        <p className="text-graphite-muted">Une MECC 2027 complète, tous frais payés, pour le grand gagnant.</p>
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
    <div className={`${styles.gain} rounded-[14px] border border-line bg-surface shadow-[0_1px_2px_rgba(15,29,44,0.05),0_12px_28px_-18px_rgba(15,29,44,0.25)] m-bleed`}>
      <img src={IMG("equipe")} alt="" />
      <div>
        <p className={styles.lot}>3 000 000 Ar</p>
        <p className="text-graphite-muted">L’équivalent de 1 000 CAD. Le participant dont la publication compte le plus de réactions à la fin du vote, pendant l’événement, est le grand gagnant.</p>
        <ul className={styles.inclus}>
          {["Le plus de réactions l’emporte", "Clôture à la fin du vote, le 18 décembre", "Aucun pitch à préparer"].map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
