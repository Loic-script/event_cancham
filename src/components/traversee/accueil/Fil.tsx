"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { basculerJaime, commenter, lireCommentaires, supprimerCommentaire, supprimerPublication } from "@/app/(app)/fil/actions";
import { Avatar } from "@/components/app/Avatar";
import { CommentIcon, HeartIcon, SendIcon, TrashIcon } from "@/components/app/icons";
import { useProfile } from "@/components/profile/useProfile";
import type { CommentaireVue, CompteurFil, DonneesFil, PublicationFil } from "@/lib/fil";
import { ACTUS, IMG, type Actu } from "@/lib/traversee/data";
import { toast } from "@/lib/traversee/store";
import { AvatarInitiales, AvatarSigle, Btn, Card, Puce, ui } from "../ui";
import styles from "./accueil.module.css";

const ZERO: CompteurFil = { jaimes: 0, commentaires: 0, aime: false };

const ordre = (i: number) => ({ "--i": Math.min(i, 6) }) as CSSProperties;

/** J'aime et commentaires d'une publication ou d'un article ; `children` complète le pied de carte. */
function Interactions({ cible, compteur, admin, children }: { cible: string; compteur: CompteurFil; admin: boolean; children?: ReactNode }) {
  const me = useProfile();
  const idPanneau = useId();
  const [source, setSource] = useState(compteur);
  const [jaime, setJaime] = useState({ aime: compteur.aime, jaimes: compteur.jaimes });
  const [total, setTotal] = useState(compteur.commentaires);
  const [occupe, setOccupe] = useState(false);
  const [ouvert, setOuvert] = useState(false);
  const [liste, setListe] = useState<CommentaireVue[] | null>(null);
  const [texte, setTexte] = useState("");
  const [envoi, setEnvoi] = useState(false);

  // Nouvelles données du serveur (après une publication, par exemple) : elles font foi.
  if (source !== compteur) {
    setSource(compteur);
    setJaime({ aime: compteur.aime, jaimes: compteur.jaimes });
    setTotal(compteur.commentaires);
  }

  async function aimer() {
    if (occupe) return;
    const avant = jaime;
    setJaime({ aime: !avant.aime, jaimes: Math.max(0, avant.jaimes + (avant.aime ? -1 : 1)) });
    setOccupe(true);
    const r = await basculerJaime(cible);
    setOccupe(false);
    if (r.error) {
      setJaime(avant);
      return toast(r.error);
    }
    setJaime({ aime: Boolean(r.aime), jaimes: r.jaimes ?? 0 });
  }

  async function basculerCommentaires() {
    const suivant = !ouvert;
    setOuvert(suivant);
    if (!suivant) return;
    const r = await lireCommentaires(cible);
    if (r.error) {
      setListe((l) => l ?? []);
      return toast(r.error);
    }
    setListe(r.commentaires ?? []);
    setTotal(r.commentaires?.length ?? 0);
  }

  async function envoyer(e: FormEvent) {
    e.preventDefault();
    const t = texte.trim();
    if (!t || envoi) return;
    setEnvoi(true);
    const r = await commenter(cible, t);
    setEnvoi(false);
    const nouveau = r.commentaire;
    if (r.error || !nouveau) return toast(r.error ?? "Le commentaire n’a pas pu être publié.");
    setListe((l) => [...(l ?? []), nouveau]);
    setTotal((n) => r.total ?? n + 1);
    setTexte("");
  }

  async function retirer(c: CommentaireVue) {
    const r = await supprimerCommentaire(c.id);
    if (r.error) return toast(r.error);
    setListe((l) => (l ?? []).filter((x) => x.id !== c.id));
    setTotal((n) => r.total ?? Math.max(0, n - 1));
  }

  return (
    <>
      <footer>
        <button type="button" onClick={aimer} className={`${ui.react} ${jaime.aime ? ui.reactOn : ""}`} aria-pressed={jaime.aime} aria-label={`J’aime, ${jaime.jaimes}`}>
          <HeartIcon width={15} height={15} fill={jaime.aime ? "currentColor" : "none"} />
          {jaime.jaimes}
        </button>
        <button
          type="button"
          onClick={basculerCommentaires}
          className={`${ui.react} ${ouvert ? styles.reactOuvert : ""}`}
          aria-expanded={ouvert}
          aria-controls={idPanneau}
          aria-label={`Commentaires, ${total}`}
        >
          <CommentIcon width={15} height={15} />
          {total}
        </button>
        {children}
      </footer>

      {ouvert ? (
        <div id={idPanneau} className={styles.commentaires}>
          {liste === null ? (
            <p className={styles.comInfo}>Chargement des commentaires…</p>
          ) : liste.length ? (
            <ul>
              {liste.map((c) => (
                <li key={c.id}>
                  <AvatarInitiales nom={c.auteur.nom} photo={c.auteur.photo} size={32} />
                  <div className={styles.bulle}>
                    <div>
                      <strong>{c.auteur.nom}</strong>
                      <small>{c.quand}</small>
                    </div>
                    <p>{c.texte}</p>
                  </div>
                  {c.aMoi || admin ? (
                    <button type="button" className={styles.comSupprimer} onClick={() => retirer(c)} aria-label={`Supprimer le commentaire de ${c.auteur.nom}`}>
                      <TrashIcon width={14} height={14} />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.comInfo}>Aucun commentaire pour l’instant. Soyez le premier à réagir.</p>
          )}
          <form className={styles.ecrire} onSubmit={envoyer}>
            <Avatar person={me} size={32} />
            <input value={texte} onChange={(e) => setTexte(e.target.value)} maxLength={1000} placeholder="Écrire un commentaire…" aria-label="Votre commentaire" />
            <button type="submit" disabled={!texte.trim() || envoi} aria-label="Publier le commentaire">
              <SendIcon width={16} height={16} />
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}

function CartePublication({ p, compteur, admin, i }: { p: PublicationFil; compteur: CompteurFil; admin: boolean; i: number }) {
  const router = useRouter();
  const me = useProfile();
  const [confirmer, setConfirmer] = useState(false);
  const [suppression, setSuppression] = useState(false);

  async function supprimer() {
    setSuppression(true);
    const r = await supprimerPublication(p.id);
    setSuppression(false);
    if (r.error) return toast(r.error);
    toast("Publication supprimée.");
    router.refresh();
  }

  return (
    <Card bleed className={styles.article} style={ordre(i)}>
      <header>
        {p.equipe ? <AvatarSigle size={44} /> : p.aMoi ? <Avatar person={me} size={44} /> : <AvatarInitiales nom={p.auteur.nom} photo={p.auteur.photo} size={44} />}
        <div className="min-w-0">
          <strong className="text-graphite">{p.equipe ? "CanCham Madagascar" : p.auteur.nom}</strong>{" "}
          {p.equipe ? <Puce tone="red">Équipe CanCham</Puce> : <Puce>Participant</Puce>}
          <br />
          <small className="text-graphite-muted">{p.equipe ? p.quand : [p.auteur.detail, p.quand].filter(Boolean).join(" · ")}</small>
        </div>
      </header>
      {p.texte ? <p className={styles.texte}>{p.texte}</p> : null}
      {p.image ? (
        <div className={styles.media}>
          <img className={styles.une} src={p.image} alt="" loading="lazy" />
        </div>
      ) : null}
      {p.video ? (
        <div className={styles.media}>
          <video className={styles.une} src={p.video} controls playsInline preload="metadata" />
        </div>
      ) : null}
      <Interactions cible={p.cible} compteur={compteur} admin={admin}>
        {p.aMoi || admin ? (
          confirmer ? (
            <div className="ml-auto flex gap-2">
              <Btn small variant="primary" onClick={supprimer} disabled={suppression}>
                {suppression ? "Suppression…" : "Confirmer"}
              </Btn>
              <Btn small onClick={() => setConfirmer(false)} disabled={suppression}>
                Annuler
              </Btn>
            </div>
          ) : (
            <Btn small className="ml-auto" onClick={() => setConfirmer(true)}>
              Supprimer
            </Btn>
          )
        ) : null}
      </Interactions>
    </Card>
  );
}

function CarteArticle({ a, compteur, admin, i }: { a: Actu; compteur: CompteurFil; admin: boolean; i: number }) {
  return (
    <Card bleed className={styles.article} style={ordre(i)}>
      <header>
        <AvatarSigle size={44} />
        <div className="min-w-0">
          <strong className="text-graphite">CanCham Madagascar</strong> <Puce tone="grey">{a.tag}</Puce>
          <br />
          <small className="text-graphite-muted">{a.date}</small>
        </div>
      </header>
      <h3>{a.t}</h3>
      <p>{a.x}</p>
      <div className={styles.media}>
        <img className={styles.une} src={IMG(a.img)} alt="" loading="lazy" />
      </div>
      <Interactions cible={`actu:${a.id}`} compteur={compteur} admin={admin}>
        <Btn small className="ml-auto" href={`https://cancham.mg/actualites/${a.id}`} external>
          Lire l’article complet
        </Btn>
      </Interactions>
    </Card>
  );
}

/** Fil d'actualité en base : publications (participants et équipe), puis articles officiels. */
export function Fil({ admin = false, publications, compteurs }: { admin?: boolean } & DonneesFil) {
  return (
    <>
      {publications.map((p, i) => (
        <CartePublication key={p.id} p={p} compteur={compteurs[p.cible] ?? ZERO} admin={admin} i={i} />
      ))}
      {ACTUS.map((a, i) => (
        <CarteArticle key={a.id} a={a} compteur={compteurs[`actu:${a.id}`] ?? ZERO} admin={admin} i={publications.length + i} />
      ))}
    </>
  );
}
