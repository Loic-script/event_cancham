"use client";

import { useCallback, useRef, useState, type FormEvent } from "react";
import { CameraIcon, DownloadIcon } from "@/components/app/icons";
import { updateProfile, useProfile } from "@/components/profile/useProfile";
import { PostEmbed } from "@/components/social/PostEmbed";
import { LEGENDE_JY_SERAI, PAGE_FACEBOOK } from "@/lib/traversee/data";
import { lisImage, setTraversee, toast, useTraversee } from "@/lib/traversee/store";
import { fullName } from "@/lib/mock/data";
import { parseSocialLink } from "@/lib/social/links";
import { Btn, Card, Champ, Direct, FileBtn, Note, PageHead, Partie, Rang, Stat, Sur, ui } from "../ui";
import { Affiche, telechargeCanvas } from "./Affiche";
import { GainTombola, Tuiles } from "./Tuiles";
import { useLive } from "./live";
import styles from "./defis.module.css";

export function DefiTombola() {
  const me = useProfile();
  const s = useTraversee();
  const inc = useLive(s.classement.length + 1, 4);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const [lien, setLien] = useState("");
  const suivi = useRef<HTMLDivElement | null>(null);

  const nom = fullName(me);
  const ligne = [me.role, me.company].filter(Boolean).join(" · ");
  const onReady = useCallback((cv: HTMLCanvasElement) => {
    canvas.current = cv;
  }, []);

  const moiR = s.lienPub ? inc[s.classement.length] : 0;
  const classement = [...s.classement.map((c, i) => ({ nom: c.nom, r: c.reactions + inc[i], moi: false })), ...(s.lienPub ? [{ nom: `${nom} (vous)`, r: moiR, moi: true }] : [])].sort((a, b) => b.r - a.r);
  const parsed = s.lienPub ? parseSocialLink(s.lienPub) : null;

  function enregistrerLien(e: FormEvent) {
    e.preventDefault();
    const u = lien.trim();
    if (!/^https?:\/\/\S+\.\S+/.test(u)) return toast("Collez le lien complet de votre publication.");
    setTraversee({ lienPub: u });
    setLien("");
    toast("Publication suivie : vous entrez dans le classement.");
  }

  async function copier() {
    try {
      await navigator.clipboard.writeText(LEGENDE_JY_SERAI);
      toast("Texte copié.");
    } catch {
      toast("Sélectionnez le texte puis copiez-le.");
    }
  }

  return (
    <>
      <PageHead title="Gagnez" accent="3 000 000 Ar" text="La publication « J’y serai » qui réunit le plus de réactions d’ici la fin du vote, pendant l’événement, l’emporte." photo="equipe" />
      <Tuiles actif="tombola" />

      <Partie n={1} titre="Ce qu’on gagne">
        <GainTombola />
      </Partie>

      <Partie n={2} titre="Comment participer">
        <ol className={styles.pas}>
          <li className={`${ui.card} ${styles.pasT}`}>
            <span className={styles.pasN}>1</span>
            <div className={styles.pasC}>
              <h3>Téléchargez votre photo « J’y serai »</h3>
              <Affiche nom={nom} ligne={ligne} photo={me.photo} onReady={onReady} />
              <FileBtn
                label={
                  <>
                    <CameraIcon width={16} height={16} />
                    {me.photo ? "Changer ma photo" : "Ajouter ma photo"}
                  </>
                }
                small
                accept="image/*"
                aria-label="Choisir ma photo de profil"
                onChange={async (e) => {
                  const u = await lisImage(e.target.files?.[0], 640);
                  if (u) {
                    updateProfile({ photo: u });
                    toast("Photo de profil mise à jour.");
                  }
                }}
              />
              <Btn
                variant="primary"
                small
                onClick={() => {
                  if (canvas.current) telechargeCanvas(canvas.current, "la-traversee-jy-serai-carre.png");
                }}
              >
                <DownloadIcon width={16} height={16} />
                Télécharger ma photo
              </Btn>
            </div>
          </li>
          <li className={`${ui.card} ${styles.pasT}`}>
            <span className={styles.pasN}>2</span>
            <div className={styles.pasC}>
              <h3>Faites une publication avec ce texte</h3>
              <p className={styles.legende}>{LEGENDE_JY_SERAI}</p>
              <div>
                <Btn small onClick={copier}>
                  Copier le texte
                </Btn>
              </div>
            </div>
          </li>
          <li className={`${ui.card} ${styles.pasT}`}>
            <span className={styles.pasN}>3</span>
            <div className={styles.pasC}>
              <h3>Mettez-la en mode Public et invitez vos amis</h3>
              <p className={styles.court}>Visibilité « Public ». Une publication privée n’est pas comptée.</p>
              <div className={styles.consigne}>
                <strong>Le compte à taguer</strong>
                <span>
                  Chambre de Commerce et de Coopération Canada Madagascar - CanCham
                  <br />
                  <a href={PAGE_FACEBOOK} target="_blank" rel="noreferrer">
                    facebook.com/canchammadagascar
                  </a>
                  <br />
                  Assurez-vous que c’est bien cette page avant de publier.
                </span>
              </div>
            </div>
          </li>
          <li className={`${ui.card} ${styles.pasT}`}>
            <span className={styles.pasN}>4</span>
            <div className={styles.pasC}>
              <h3>Copiez le lien de votre publication ici</h3>
              {s.lienPub ? (
                <>
                  <Note>
                    Publication suivie : <b style={{ overflowWrap: "anywhere" }}>{s.lienPub}</b>
                  </Note>
                  {parsed?.ok ? <PostEmbed link={parsed} height={320} /> : null}
                  <div>
                    <Btn small onClick={() => setTraversee({ lienPub: "" })}>
                      Changer de lien
                    </Btn>
                  </div>
                </>
              ) : (
                <form onSubmit={enregistrerLien} className={styles.formLien}>
                  <Champ label="Lien Facebook, Instagram ou LinkedIn" htmlFor="l-pub">
                    <input id="l-pub" type="url" inputMode="url" required value={lien} onChange={(e) => setLien(e.target.value)} placeholder="https://…" className={ui.saisie} />
                  </Champ>
                  <Btn variant="primary" type="submit">
                    Enregistrer
                  </Btn>
                </form>
              )}
            </div>
          </li>
          <li className={`${ui.card} ${styles.pasT}`}>
            <span className={styles.pasN}>5</span>
            <div className={styles.pasC}>
              <h3>Suivez l’évolution en temps réel</h3>
              <p className={styles.court}>
                {s.lienPub ? "Votre publication est dans le classement. " : "Votre publication entre dans le classement dès que le lien est enregistré. "}
                <a
                  href="#suivi-tombola"
                  onClick={(e) => {
                    e.preventDefault();
                    suivi.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  Voir le classement
                </a>
              </p>
            </div>
          </li>
        </ol>
      </Partie>

      <div ref={suivi} id="suivi-tombola" className="scroll-mt-20" />
      <Partie n={3} titre="Suivi du défi">
        <div className={ui.gLarge}>
          <Card bleed>
            <div className={`${ui.pad} flex flex-wrap items-center justify-between gap-2.5 !pb-2`}>
              <Sur className="!mb-0">Classement des publications</Sur>
              <Direct>En temps réel · simulation</Direct>
            </div>
            <div className={ui.defile}>
              <table className={ui.tab}>
                <tbody>
                  {classement.map((x, i) => (
                    <tr key={x.nom} className={x.moi ? "moi" : ""}>
                      <td>
                        <Rang n={i + 1} />
                      </td>
                      <td>{x.nom}</td>
                      <td className={ui.n}>{x.r} réactions</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Stat label="Ma publication" value={s.lienPub ? moiR : "—"} text={s.lienPub ? "réactions pour l’instant" : "Enregistrez votre lien pour entrer dans le classement"} />
        </div>
      </Partie>
    </>
  );
}
