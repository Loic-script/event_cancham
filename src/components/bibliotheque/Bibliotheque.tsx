import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ChevronRightIcon, FilmIcon, FolderIcon, FolderLockIcon, LayoutIcon, SearchIcon } from "@/components/app/icons";
import type { Bibliotheque } from "@/lib/ressources/requetes";
import { CarteDossierUI, CarteRessourceUI, LigneRessourceUI } from "./Cartes";
import { imageDossier, lienBibli, type ParamsBibli } from "./liens";
import { Outils } from "./Outils";
import styles from "./bibliotheque.module.css";

type Props = {
  data: Bibliotheque;
  params: ParamsBibli;
  base: string;
  lienRessource: (id: string) => string;
  equipe: boolean;
  actionsEntete?: ReactNode;
  listeRessources?: ReactNode;
  apresBanniere?: ReactNode;
};

export function FilAriane({ base, params, fil }: { base: string; params: ParamsBibli; fil: { id: string; nom: string }[] }) {
  if (!fil.length) return null;
  return (
    <nav className={styles.fil} aria-label="Fil d’Ariane">
      <Link href={lienBibli(base, { ...params, q: "" }, { dossierId: null })}>Bibliothèque</Link>
      {fil.map((d, i) => (
        <span key={d.id} className="inline-flex items-center gap-1.5">
          <ChevronRightIcon width={14} height={14} />
          {i === fil.length - 1 ? <strong>{d.nom}</strong> : <Link href={lienBibli(base, { ...params, q: "" }, { dossierId: d.id })}>{d.nom}</Link>}
        </span>
      ))}
    </nav>
  );
}

export function Parcours({ data }: { data: Bibliotheque }) {
  const d = data.dossier!;
  const { terminees, total, videos } = data.progression;
  const pct = total ? Math.round((terminees / total) * 100) : 0;
  return (
    <>
      <section className={styles.banniere} style={{ "--couv": d.couverture ? `url(${imageDossier(d.id, "couverture")})` : undefined } as CSSProperties}>
        <small>{d.restreintHerite ? "Dossier réservé" : "Dossier"}</small>
        <h1>{d.nom}</h1>
        <div className={styles.banniereStats}>
          <span>
            <LayoutIcon width={15} height={15} />
            {total} ressource{total > 1 ? "s" : ""}
          </span>
          {videos ? (
            <span>
              <FilmIcon width={15} height={15} />
              {videos} vidéo{videos > 1 ? "s" : ""}
            </span>
          ) : null}
          {d.restreintHerite ? (
            <span>
              <FolderLockIcon width={15} height={15} />
              Accès réservé
            </span>
          ) : null}
        </div>
      </section>
      <div className={styles.parcoursInfos}>
        <div className={styles.progression}>
          <p>
            <b>{terminees}</b> étape{terminees > 1 ? "s" : ""} terminée{terminees > 1 ? "s" : ""} sur {total}
          </p>
          <div className={styles.barre} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Progression du parcours">
            <i style={{ width: `${pct}%` }} />
          </div>
        </div>
        {d.auteurNom ? (
          <div className={styles.auteur}>
            {d.auteurPhoto ? <img src={imageDossier(d.id, "auteur")} alt="" /> : <span className={styles.auteurInit}>{d.auteurNom.split(/\s+/).map((m) => m[0]).slice(0, 2).join("")}</span>}
            <div className="min-w-0">
              <small>Auteur</small>
              <strong>{d.auteurNom}</strong>
              {d.auteurRole ? <small className="!font-medium !text-graphite-muted">{d.auteurRole}</small> : null}
              {d.auteurBio ? <p>{d.auteurBio}</p> : null}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

export function VueBibliotheque({ data, params, base, lienRessource, equipe, actionsEntete, listeRessources, apresBanniere }: Props) {
  const dansDossier = Boolean(data.dossier);
  const liste = params.vue === "liste";
  const ressourcesUI =
    listeRessources ??
    (data.ressources.length ? (
      liste || dansDossier ? (
        <div className={styles.liste}>
          {data.ressources.map((r, i) => (
            <LigneRessourceUI key={r.id} r={r} lien={lienRessource(r.id)} i={i} numero={dansDossier && !data.recherche ? i + 1 : undefined} equipe={equipe} />
          ))}
        </div>
      ) : (
        <div className={styles.grille}>
          {data.ressources.map((r, i) => (
            <CarteRessourceUI key={r.id} r={r} lien={lienRessource(r.id)} i={i} equipe={equipe} />
          ))}
        </div>
      )
    ) : null);

  return (
    <>
      <FilAriane base={base} params={params} fil={data.fil} />
      {dansDossier ? (
        <>
          {actionsEntete ? <div className={`${styles.tete} !mb-3 !justify-end`}>{actionsEntete}</div> : null}
          <Parcours data={data} />
          {apresBanniere}
        </>
      ) : (
        <div className={styles.tete}>
          <div>
            <h1>
              Bibliothèque des <em>ressources</em>
            </h1>
            <p>Guides, modèles, formations et rapports réservés aux membres de la CanCham, à lire dans un lecteur protégé.</p>
          </div>
          {actionsEntete ? <div className={styles.teteActions}>{actionsEntete}</div> : null}
        </div>
      )}
      <div className={dansDossier ? "mt-5" : ""}>
        <Outils base={base} params={params} compteurs={data.compteurs} dansDossier={dansDossier} />
      </div>

      {data.recherche ? (
        <p className="mb-3 text-[13.5px] text-graphite-muted">
          Résultats pour « {params.q} » : {data.sousDossiers.length} dossier{data.sousDossiers.length > 1 ? "s" : ""}, {data.ressources.length} ressource{data.ressources.length > 1 ? "s" : ""}.
        </p>
      ) : null}

      {data.sousDossiers.length && (!dansDossier || data.recherche) ? (
        <>
          <div className={styles.titreSection}>
            <h2>Dossiers</h2>
            <b>{data.sousDossiers.length}</b>
          </div>
          <div className={styles.dossiers}>
            {data.sousDossiers.map((d, i) => (
              <CarteDossierUI key={d.id} d={d} lien={lienBibli(base, { ...params, q: "" }, { dossierId: d.id })} equipe={equipe} i={i} />
            ))}
          </div>
        </>
      ) : null}

      {ressourcesUI || !data.sections.length ? (
        <>
          <div className={styles.titreSection}>
            <h2>{dansDossier && !data.recherche ? "Étapes du parcours" : "Ressources"}</h2>
            <b>{data.ressources.length}</b>
          </div>
          {ressourcesUI ?? (
            <div className={styles.vide}>
              {data.recherche ? <SearchIcon /> : <FolderIcon />}
              <p>{data.recherche ? "Aucune ressource ne correspond à cette recherche." : params.filtre !== "tout" ? "Aucune ressource dans ce filtre." : "Ce dossier ne contient pas encore de ressource."}</p>
            </div>
          )}
        </>
      ) : null}

      {data.sections.map((s) => (
        <section key={s.dossier.id}>
          <div className={styles.titreSection}>
            {s.dossier.restreint ? <FolderLockIcon width={18} height={18} className="text-leaf-ink" /> : <FolderIcon width={18} height={18} className="text-gold" />}
            <h2>{s.dossier.nom}</h2>
            <b>{s.dossier.nbRessources}</b>
            <Link href={lienBibli(base, { ...params, q: "" }, { dossierId: s.dossier.id })} className="ml-auto inline-flex items-center gap-1 text-[13px] font-bold text-gold hover:underline">
              Ouvrir le dossier
              <ChevronRightIcon width={14} height={14} />
            </Link>
          </div>
          {s.ressources.length ? (
            <div className={styles.liste}>
              {s.ressources.map((r, i) => (
                <LigneRessourceUI key={r.id} r={r} lien={lienRessource(r.id)} i={i} numero={i + 1} equipe={equipe} />
              ))}
            </div>
          ) : (
            <div className={styles.vide}>
              <FolderIcon />
              <p>{s.dossier.nbSousDossiers ? "Ce dossier contient des sous-dossiers : ouvrez-le pour les parcourir." : "Aucune ressource dans ce dossier pour l’instant."}</p>
            </div>
          )}
        </section>
      ))}
    </>
  );
}
