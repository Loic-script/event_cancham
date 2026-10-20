"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { DownloadIcon, EyeIcon, FacebookIcon, SpinnerIcon } from "@/components/app/icons";
import { useProfile } from "@/components/profile/useProfile";
import { PostEmbed } from "@/components/social/PostEmbed";
import { enregistrerPublication } from "@/app/(app)/defis/actions";
import type { MaParticipation, Participant } from "@/lib/defis";
import { fullName } from "@/lib/mock/data";
import { parseSocialLink } from "@/lib/social/links";
import { LEGENDE_JY_SERAI, PAGE_FACEBOOK } from "@/lib/traversee/data";
import { CLASSEMENT_VISIBLE } from "@/lib/traversee/pitchs";
import { toast } from "@/lib/traversee/store";
import { Modal } from "../Modal";
import { ChoixPhotoProfil } from "../profil/ChoixPhotoProfil";
import { Btn, Card, Champ, Direct, Note, Partie, Stat, Sur, ui } from "../ui";
import { Affiche, telechargeCanvas } from "./Affiche";
import { Classement, type EntreeClassement } from "./Classement";
import { GainTombola } from "./Tuiles";
import styles from "./defis.module.css";

// Heure de Madagascar : le serveur et le navigateur affichent la même heure de relevé.
const HEURE = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Indian/Antananarivo" });

type DefiTombolaProps = {
  /** Publication enregistrée par ce compte, avec son dernier relevé de réactions. */
  maPublication: MaParticipation | null;
  /** Publications du défi, transmises seulement quand le classement est ouvert aux participants. */
  classement: Participant[];
  monId: number;
};

export function DefiTombola({ maPublication, classement, monId }: DefiTombolaProps) {
  const me = useProfile();
  const router = useRouter();
  const [releve, setReleve] = useState(false);
  const [erreurReleve, setErreurReleve] = useState<string | null>(null);
  const [changer, setChanger] = useState(false);
  const [envoi, setEnvoi] = useState(false);
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
    setErreurReleve(null);
    await chargerFb();
    toast("Compte Facebook déconnecté.");
  }
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const [lien, setLien] = useState("");
  const [apercu, setApercu] = useState<string | null>(null);
  const suivi = useRef<HTMLDivElement | null>(null);

  const nom = fullName(me);
  const ligne = [me.role, me.company].filter(Boolean).join(" · ");
  const onReady = useCallback((cv: HTMLCanvasElement) => {
    canvas.current = cv;
  }, []);

  const lienPub = maPublication?.lien ?? "";
  const moiR = maPublication?.reactions ?? null;
  const moiRetire = Boolean(maPublication?.retire);
  const entrees: EntreeClassement[] = classement
    .filter((c) => !c.retire)
    .map((c) => {
      const p = parseSocialLink(c.lien);
      const moi = c.userId === monId;
      return {
        id: c.id,
        nom: moi ? `${c.porteur} (vous)` : c.porteur,
        r: c.reactions ?? 0,
        moi,
        photo: c.photo ?? undefined,
        initiales: c.porteur,
        lien: p.ok ? p.url : c.lien,
        reseau: p.ok && (p.network === "facebook" || p.network === "instagram") ? p.network : null,
      };
    })
    .sort((a, b) => b.r - a.r);
  const parsed = lienPub ? parseSocialLink(lienPub) : null;

  /** Le serveur lit les réactions sur Facebook et les enregistre sur la publication de ce compte. */
  async function relever(url: string, silencieux = false) {
    setReleve(true);
    try {
      const r = await fetch(`/api/publications/reactions?url=${encodeURIComponent(url)}`, { cache: "no-store" });
      const d = (await r.json()) as { ok: boolean; reactions?: number; message?: string; detail?: string | null };
      if (d.ok) {
        setErreurReleve(null);
        if (!silencieux) toast(`${d.reactions ?? 0} réaction${(d.reactions ?? 0) > 1 ? "s" : ""} relevée${(d.reactions ?? 0) > 1 ? "s" : ""} sur Facebook.`);
        router.refresh();
      } else {
        setErreurReleve(`${d.message ?? "Réactions indisponibles."}${d.detail ? ` (${d.detail})` : ""}`);
        if (!silencieux) toast(d.message ?? "Réactions indisponibles.");
      }
    } catch {
      setErreurReleve("Facebook n’a pas répondu. Réessayez dans un instant.");
    } finally {
      setReleve(false);
    }
  }

  async function enregistrerLien(e: FormEvent) {
    e.preventDefault();
    const u = lien.trim();
    if (!/^https?:\/\/\S+\.\S+/.test(u)) return toast("Collez le lien complet de votre publication.");
    setEnvoi(true);
    const { error } = await enregistrerPublication(u);
    setEnvoi(false);
    if (error) return toast(error);
    setLien("");
    setChanger(false);
    setErreurReleve(null);
    toast(CLASSEMENT_VISIBLE ? "Publication suivie : vous entrez dans le classement." : "Publication enregistrée pour le défi.");
    router.refresh();
    const p = parseSocialLink(u);
    void relever(p.ok ? p.url : u, true);
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
      {apercu ? (
        <Modal onClose={() => setApercu(null)} label="Ma photo J’y serai" size="large" className="!p-0 !overflow-hidden">
          <img src={apercu} alt="Ma photo J’y serai, format carré" className="block w-full h-auto" />
          <div className="flex flex-wrap gap-2 p-4">
            <Btn
              variant="primary"
              onClick={() => {
                if (canvas.current) telechargeCanvas(canvas.current, "la-traversee-jy-serai-carre.png");
              }}
            >
              <DownloadIcon width={16} height={16} />
              Télécharger
            </Btn>
            <Btn onClick={() => setApercu(null)} className="ml-auto">
              Fermer
            </Btn>
          </div>
        </Modal>
      ) : null}
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
              <ChoixPhotoProfil small retrait={false} />
              <Btn
                small
                onClick={() => {
                  if (canvas.current) setApercu(canvas.current.toDataURL("image/png"));
                }}
              >
                <EyeIcon width={16} height={16} />
                Voir la photo
              </Btn>
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
              {lienPub && !changer ? (
                <>
                  <Note>
                    Publication suivie : <b style={{ overflowWrap: "anywhere" }}>{lienPub}</b>
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
                    <Btn small variant="primary" disabled={releve} onClick={() => void relever(lienPub)}>
                      {releve ? <SpinnerIcon width={15} height={15} className="animate-spin" /> : null}
                      Actualiser les réactions
                    </Btn>
                    <Btn small onClick={() => setChanger(true)}>
                      Changer de lien
                    </Btn>
                    {process.env.NODE_ENV !== "production" && fb?.connected ? (
                      <a href={`/api/facebook/diag?url=${encodeURIComponent(lienPub)}`} target="_blank" rel="noreferrer" className="self-center text-[12px] font-semibold text-graphite-faint underline-offset-4 hover:underline">
                        Détails techniques
                      </a>
                    ) : null}
                  </div>
                </>
              ) : (
                <form onSubmit={(e) => void enregistrerLien(e)} className={styles.formLien}>
                  <Champ label="Lien Facebook, Instagram ou LinkedIn" htmlFor="l-pub">
                    <input id="l-pub" type="url" inputMode="url" required value={lien} onChange={(e) => setLien(e.target.value)} placeholder="https://…" className={ui.saisie} />
                  </Champ>
                  <div className="flex flex-wrap gap-2">
                    <Btn variant="primary" type="submit" disabled={envoi}>
                      {envoi ? "Enregistrement…" : "Enregistrer"}
                    </Btn>
                    {changer ? (
                      <Btn
                        onClick={() => {
                          setChanger(false);
                          setLien("");
                        }}
                      >
                        Annuler
                      </Btn>
                    ) : null}
                  </div>
                </form>
              )}
            </div>
          </li>
          <li className={`${ui.card} ${styles.pasT}`}>
            <span className={styles.pasN}>5</span>
            <div className={styles.pasC}>
              <h3>Suivez l’évolution en temps réel</h3>
              {CLASSEMENT_VISIBLE ? (
                <p className={styles.court}>
                  {!lienPub ? "Votre publication entre dans le classement dès que le lien est enregistré. " : moiRetire ? "Votre publication a été retirée du classement par l’équipe CanCham. " : "Votre publication est dans le classement. "}
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
              ) : (
                <p className={styles.court}>{lienPub ? "Votre publication est enregistrée : actualisez ses réactions quand vous voulez." : "Enregistrez le lien de votre publication pour suivre ses réactions."} Le classement des publications sera affiché ici prochainement.</p>
              )}
            </div>
          </li>
        </ol>
      </Partie>

      <div ref={suivi} id="suivi-tombola" className="scroll-mt-20" />
      <Partie n={3} titre="Suivi du défi">
        <div className={ui.gLarge}>
          {CLASSEMENT_VISIBLE ? (
            <Card bleed>
              <div className={`${ui.pad} flex flex-wrap items-center justify-between gap-2.5 !pb-2`}>
                <Sur className="!mb-0">Classement des publications</Sur>
                <Direct>Réactions relevées sur Facebook</Direct>
              </div>
              <Classement entrees={entrees} />
            </Card>
          ) : (
            <Card pad bleed className="grid content-start gap-1.5">
              <Sur className="!mb-0">Classement des publications</Sur>
              <strong className="text-graphite">Le classement sera affiché ici prochainement.</strong>
              <p className="text-graphite-muted">En attendant, suivez les réactions de votre publication.</p>
            </Card>
          )}
          <Stat
            label="Ma publication"
            value={lienPub && moiR !== null ? moiR : "—"}
            text={
              !lienPub
                ? CLASSEMENT_VISIBLE ? "Enregistrez votre lien pour entrer dans le classement" : "Enregistrez votre lien pour suivre ses réactions"
                : erreurReleve
                  ? erreurReleve
                  : releve
                    ? "Relevé en cours…"
                    : moiR !== null && maPublication?.releveLe
                      ? `réactions Facebook · ${maPublication.commentaires ?? 0} commentaires · ${maPublication.partages ?? 0} partages · relevé à ${HEURE.format(new Date(maPublication.releveLe)).replace(":", " h ")}`
                      : "Réactions pas encore relevées : actualisez quand votre Facebook est connecté."
            }
          >
            {lienPub ? (
              <Btn small className="mt-3" disabled={releve} onClick={() => void relever(lienPub)}>
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
