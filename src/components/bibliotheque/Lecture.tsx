import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, LockIcon, ShieldCheckIcon } from "@/components/app/icons";
import type { Decision } from "@/lib/ressources/acces";
import { nettoyerBlocs } from "@/lib/ressources/blocs";
import type { CarteRessource } from "@/lib/ressources/requetes";
import { FORMATS, prixLisible, type Format } from "@/lib/ressources/types";
import { moyensDisponibles } from "@/lib/paiement/prestataire";
import { CarteAchat, BoutonTerminer } from "./Interactions";
import { Lecteur } from "./Lecteur";
import styles from "./bibliotheque.module.css";

export type RessourceLecture = {
  id: string;
  titre: string;
  description: string | null;
  format: Format;
  taille: string | null;
  pages: number;
  prix: number;
  contenu: unknown;
  dossier: { id: string; nom: string } | null;
};

type Props = {
  r: RessourceLecture;
  decision: Decision;
  lue: boolean;
  etapes: CarteRessource[];
  lienRessource: (id: string) => string;
  lienRetour: string;
  libelleRetour: string;
  contact: string;
  avantContenu?: ReactNode;
  equipe: boolean;
};

function Etapes({ etapes, courante, dossier, lienRessource }: { etapes: CarteRessource[]; courante: string; dossier: { nom: string }; lienRessource: (id: string) => string }) {
  return (
    <aside className={styles.etapes} aria-label="Étapes du dossier">
      <div className={styles.etapesTete}>
        <small>Dossier</small>
        <strong>{dossier.nom}</strong>
        <p>
          {etapes.length} ressource{etapes.length > 1 ? "s" : ""} · {etapes.filter((e) => e.lue).length} terminée{etapes.filter((e) => e.lue).length > 1 ? "s" : ""}
        </p>
      </div>
      <nav className={styles.etapesListe}>
        {etapes.map((e, i) => {
          const actuelle = e.id === courante;
          const etat = e.lue ? "Terminée" : actuelle ? "En cours" : !e.ouverte ? "Verrouillée" : [FORMATS[e.format], e.taille].filter(Boolean).join(" · ");
          return (
            <Link key={e.id} href={lienRessource(e.id)} className={`${styles.etape} ${actuelle ? styles.etapeCourante : ""} ${!e.ouverte ? styles.etapeVerrou : ""}`} aria-current={actuelle ? "step" : undefined}>
              <span className={`${styles.numero} ${e.lue && !actuelle ? styles.numeroFait : ""}`}>{e.lue && !actuelle ? <CheckIcon width={13} height={13} strokeWidth={3} /> : !e.ouverte ? <LockIcon width={12} height={12} /> : i + 1}</span>
              <span className={styles.etapeTexte}>
                <strong>{e.titre}</strong>
                <small>{etat}</small>
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function PageLecture({ r, decision, lue, etapes, lienRessource, lienRetour, libelleRetour, contact, avantContenu, equipe }: Props) {
  const index = etapes.findIndex((e) => e.id === r.id);
  const precedente = index > 0 ? etapes[index - 1] : null;
  const suivante = index >= 0 && index < etapes.length - 1 ? etapes[index + 1] : null;
  const surtitre = [FORMATS[r.format], r.format === "pdf" || r.format === "docx" ? (r.pages ? `${r.pages} page${r.pages > 1 ? "s" : ""}` : null) : null, r.taille].filter(Boolean).join(" · ");
  const ouverte = decision === "ok";

  return (
    <div className={r.dossier && etapes.length ? styles.lecture : ""}>
      <div className="min-w-0">
        <div className={styles.lectureEntete}>
          <Link href={lienRetour} className={styles.retour}>
            <ArrowLeftIcon width={16} height={16} />
            {libelleRetour}
          </Link>
          <p className={styles.surtitre}>{surtitre}</p>
          <h1 className={styles.lectureTitre}>{r.titre}</h1>
          {r.description ? <p className={styles.lectureDesc}>{r.description}</p> : null}
          <p className={styles.protege}>
            <ShieldCheckIcon width={16} height={16} />
            Consultation réservée aux membres. Contenu protégé.
          </p>
        </div>
        {avantContenu}
        {ouverte ? (
          <>
            <Lecteur id={r.id} format={r.format} pages={r.pages} blocs={r.format === "page" ? nettoyerBlocs(r.contenu) : null} />
            {!equipe ? <BoutonTerminer id={r.id} dejaLue={lue} suivante={suivante && suivante.ouverte ? { href: lienRessource(suivante.id), titre: suivante.titre } : null} /> : null}
          </>
        ) : (
          <CarteAchat id={r.id} prix={prixLisible(r.prix)} moyens={moyensDisponibles(r.prix)} contact={contact} />
        )}
        {precedente || suivante ? (
          <div className={styles.lectureBas}>
            {precedente ? (
              <Link href={lienRessource(precedente.id)} className={styles.navEtape}>
                <small>
                  <ArrowLeftIcon width={13} height={13} />
                  Étape précédente
                </small>
                <strong>{precedente.titre}</strong>
              </Link>
            ) : (
              <span />
            )}
            {suivante ? (
              <Link href={lienRessource(suivante.id)} className={`${styles.navEtape} ${styles.navSuivante}`}>
                <small>
                  Étape suivante
                  <ArrowRightIcon width={13} height={13} />
                </small>
                <strong>{suivante.titre}</strong>
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
      {r.dossier && etapes.length ? <Etapes etapes={etapes} courante={r.id} dossier={r.dossier} lienRessource={lienRessource} /> : null}
    </div>
  );
}
