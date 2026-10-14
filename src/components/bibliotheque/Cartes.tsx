import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { CalendarIcon, CheckIcon, ChevronRightIcon, FileTextIcon, FilmIcon, FolderIcon, FolderLockIcon, ImageIcon, LayoutIcon, LockIcon } from "@/components/app/icons";
import type { CarteDossier, CarteRessource } from "@/lib/ressources/requetes";
import { CATEGORIES, FORMATS, actionLecture, dateCourte, prixLisible, type Format } from "@/lib/ressources/types";
import { Btn } from "@/components/traversee/ui";
import { couvertureRessource } from "./liens";
import styles from "./bibliotheque.module.css";

export function IconeFormat({ format, ...props }: { format: Format; width?: number; height?: number }) {
  if (format === "video") return <FilmIcon {...props} />;
  if (format === "photo") return <ImageIcon {...props} />;
  if (format === "page") return <LayoutIcon {...props} />;
  return <FileTextIcon {...props} />;
}

export function Couverture({ r }: { r: Pick<CarteRessource, "id" | "couverture" | "format" | "titre"> }) {
  return r.couverture ? (
    <img src={couvertureRessource(r.id)} alt="" loading="lazy" draggable={false} />
  ) : (
    <span className={styles.couvVide}>
      <IconeFormat format={r.format} />
    </span>
  );
}

export function libelleTaille(r: Pick<CarteRessource, "format" | "taille">): string {
  return [FORMATS[r.format], r.taille].filter(Boolean).join(" · ");
}

export function Puces({ r, equipe = false }: { r: CarteRessource; equipe?: boolean }) {
  return (
    <div className={styles.meta}>
      <span className={styles.chip}>{CATEGORIES[r.categorie]}</span>
      {r.type === "payant" ? <span className={`${styles.chip} ${styles.chipPrix}`}>{prixLisible(r.prix)}</span> : <span className={`${styles.chip} ${styles.chipGratuit}`}>Gratuit</span>}
      {equipe && r.fichierManquant ? <span className={`${styles.chip} ${styles.chipManquant}`}>Fichier manquant</span> : null}
      <span>{libelleTaille(r)}</span>
      <time dateTime={new Date(r.date).toISOString()}>
        <CalendarIcon width={13} height={13} />
        {dateCourte(r.date)}
      </time>
    </div>
  );
}

export function ActionRessource({ r, lien, small = true }: { r: CarteRessource; lien: string; small?: boolean }) {
  if (!r.ouverte) {
    return (
      <Btn small={small} variant="primary" href={lien}>
        <LockIcon width={15} height={15} />
        Acheter
      </Btn>
    );
  }
  return (
    <Btn small={small} variant={r.lue ? "light" : "navy"} href={lien}>
      {r.lue ? <CheckIcon width={15} height={15} /> : null}
      {r.lue ? "Relire" : actionLecture(r.format)}
    </Btn>
  );
}

export function CarteDossierUI({ d, lien, equipe, i }: { d: CarteDossier; lien: string; equipe: boolean; i: number }) {
  return (
    <Link href={lien} className={styles.dossier} style={{ "--i": Math.min(i, 10) } as CSSProperties}>
      <span className={`${styles.dossierIco} ${d.restreint ? styles.dossierIcoRestreint : ""}`}>{d.restreint ? <FolderLockIcon /> : <FolderIcon />}</span>
      <span className={styles.dossierTexte}>
        <strong>{d.nom}</strong>
        <small>
          {d.nbRessources} ressource{d.nbRessources > 1 ? "s" : ""}
          {d.nbSousDossiers ? ` · ${d.nbSousDossiers} dossier${d.nbSousDossiers > 1 ? "s" : ""}` : ""}
        </small>
        {d.restreint ? <em>{equipe ? `Réservé à ${d.nbAcces} entreprise${d.nbAcces > 1 ? "s" : ""}` : "Accès réservé"}</em> : null}
      </span>
      <ChevronRightIcon className={styles.dossierFleche} width={18} height={18} />
    </Link>
  );
}

export function CarteRessourceUI({ r, lien, i, equipe = false }: { r: CarteRessource; lien: string; i: number; equipe?: boolean }) {
  return (
    <article className={styles.carte} style={{ "--i": Math.min(i, 12) } as CSSProperties}>
      <Link href={lien} className={styles.couv} tabIndex={-1} aria-hidden>
        <Couverture r={r} />
        <span className={styles.badgeFormat}>{libelleTaille(r)}</span>
        {r.lue ? (
          <span className={styles.badgeLue} title="Terminée">
            <CheckIcon width={16} height={16} strokeWidth={3} />
          </span>
        ) : !r.ouverte ? (
          <span className={styles.badgeVerrou} title="Ressource payante">
            <LockIcon width={15} height={15} />
          </span>
        ) : null}
      </Link>
      <div className={styles.carteCorps}>
        <h3>
          <Link href={lien}>{r.titre}</Link>
        </h3>
        {r.description ? <p>{r.description}</p> : null}
        <Puces r={r} equipe={equipe} />
        <div className={styles.carteBas}>
          <ActionRessource r={r} lien={lien} />
        </div>
      </div>
    </article>
  );
}

export function LigneRessourceUI({ r, lien, i, numero, equipe = false, avant, actions }: { r: CarteRessource; lien: string; i: number; numero?: number; equipe?: boolean; avant?: ReactNode; actions?: ReactNode }) {
  return (
    <div className={styles.ligne} style={{ "--i": Math.min(i, 14) } as CSSProperties}>
      {avant}
      {numero ? <span className={`${styles.numero} ${r.lue ? styles.numeroFait : ""}`}>{r.lue ? <CheckIcon width={14} height={14} strokeWidth={3} /> : numero}</span> : null}
      <Link href={lien} className={styles.vignette} tabIndex={-1} aria-hidden>
        <Couverture r={r} />
      </Link>
      <div className={styles.ligneTexte}>
        <h3>
          <Link href={lien}>{r.titre}</Link>
        </h3>
        {r.description ? <p>{r.description}</p> : null}
        <Puces r={r} equipe={equipe} />
      </div>
      <div className={styles.ligneActions}>{actions ?? <ActionRessource r={r} lien={lien} />}</div>
    </div>
  );
}
