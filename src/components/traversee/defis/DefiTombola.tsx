"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { CameraIcon, DownloadIcon, FacebookIcon, SpinnerIcon } from "@/components/app/icons";
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
  const inc = useLive(s.classement.length, 4);
  const [releve, setReleve] = useState(false);
  const [fb, setFb] = useState<{ configured: boolean; connected: boolean; name?: string | null } | null>(null);

  const chargerFb = useCallback(async () => {
    try {
      const r = await fetch("/api/facebook/status", { cache: "no-store" });
      setFb((await r.json()) as { configured: boolean; connected: boolean; name?: string | null });
    } catch {
      setFb({ configured: false, connected: false });
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => void chargerFb(), 0);
    const retour = new URLSearchParams(window.location.search).get("facebook");
    if (retour === "ok") toast("Compte Facebook connecté.");
    if (retour === "refus") toast("Connexion Facebook annulée.");
    if (retour === "erreur") toast("Connexion Facebook impossible. Vérifiez la configuration de l’application Meta.");
    if (retour) window.history.replaceState(null, "", window.location.pathname);
    return () => window.clearTimeout(id);
  }, [chargerFb]);

  async function deconnecterFb() {
    await fetch("/api/facebook/logout", { method: "POST" });
    setTraversee({ lienReactions: null, lienReleve: null });
    await chargerFb();
    toast("Compte Facebook déconnecté.");
  }
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const [lien, setLien] = useState("");
  const suivi = useRef<HTMLDivElement | null>(null);

  const nom = fullName(me);
  const ligne = [me.role, me.company].filter(Boolean).join(" · ");
  const onReady = useCallback((cv: HTMLCanvasElement) => {
    canvas.current = cv;
  }, []);

  const moiR = s.lienReactions?.reactions ?? null;
  const classement = [...s.classement.map((c, i) => ({ nom: c.nom, r: c.reactions + inc[i], moi: false })), ...(s.lienPub ? [{ nom: `${nom} (vous)`, r: moiR ?? 0, moi: true }] : [])].sort((a, b) => b.r - a.r);
  const parsed = s.lienPub ? parseSocialLink(s.lienPub) : null;

  async function relever(url: string, silencieux = false) {
    setReleve(true);
    try {
      const r = await fetch(`/api/publications/reactions?url=${encodeURIComponent(url)}`, { cache: "no-store" });
      const d = (await r.json()) as { ok: boolean; reactions?: number; comments?: number; shares?: number; at?: number; message?: string };
      if (d.ok) {
        setTraversee({ lienReactions: { reactions: d.reactions ?? 0, comments: d.comments ?? 0, shares: d.shares ?? 0, at: d.at ?? Date.now() }, lienReleve: null });
        if (!silencieux) toast(`${d.reactions ?? 0} réaction${(d.reactions ?? 0) > 1 ? "s" : ""} relevée${(d.reactions ?? 0) > 1 ? "s" : ""} sur Facebook.`);
      } else {
        setTraversee({ lienReactions: null, lienReleve: d.message ?? "Réactions indisponibles." });
        if (!silencieux) toast(d.message ?? "Réactions indisponibles.");
      }
    } catch {
      setTraversee({ lienReleve: "Facebook n’a pas répondu. Réessayez dans un instant." });
    } finally {
      setReleve(false);
    }
  }

  function enregistrerLien(e: FormEvent) {
    e.preventDefault();
    const u = lien.trim();
    if (!/^https?:\/\/\S+\.\S+/.test(u)) return toast("Collez le lien complet de votre publication.");
    setTraversee({ lienPub: u, lienReactions: null, lienReleve: null });
    setLien("");
    toast("Publication suivie : vous entrez dans le classement.");
    void relever(u, true);
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
                  <div className={styles.consigne}>
                    <strong>Réactions réelles</strong>
                    {fb?.connected ? (
                      <span>
                        Compte Facebook connecté{fb.name ? ` : ${fb.name}` : ""}. Les réactions sont lues directement sur votre publication.{" "}
                        <button type="button" onClick={() => void deconnecterFb()} className="cursor-pointer font-bold text-gold underline-offset-4 hover:underline">
                          Déconnecter
                        </button>
                      </span>
                    ) : (
                      <span>Pour afficher le vrai nombre de réactions, connectez le compte Facebook qui a publié.</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!fb?.connected ? (
                      <Btn small variant="navy" href="/api/facebook/login?next=/defis/tombola" external>
                        <FacebookIcon width={15} height={15} />
                        Connecter mon Facebook
                      </Btn>
                    ) : null}
                    <Btn small variant="primary" disabled={releve} onClick={() => void relever(s.lienPub)}>
                      {releve ? <SpinnerIcon width={15} height={15} className="animate-spin" /> : null}
                      Actualiser les réactions
                    </Btn>
                    <Btn small onClick={() => setTraversee({ lienPub: "", lienReactions: null, lienReleve: null })}>
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
          <Stat
            label="Ma publication"
            value={s.lienPub && moiR !== null ? moiR : "—"}
            text={
              !s.lienPub
                ? "Enregistrez votre lien pour entrer dans le classement"
                : moiR !== null && s.lienReactions
                  ? `réactions Facebook · ${s.lienReactions.comments} commentaires · ${s.lienReactions.shares} partages · relevé à ${new Date(s.lienReactions.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
                  : s.lienReleve ?? "Relevé en cours…"
            }
          >
            {s.lienPub ? (
              <Btn small className="mt-3" disabled={releve} onClick={() => void relever(s.lienPub)}>
                {releve ? <SpinnerIcon width={15} height={15} className="animate-spin" /> : null}
                Actualiser
              </Btn>
            ) : null}
          </Stat>
        </div>
      </Partie>
    </>
  );
}
