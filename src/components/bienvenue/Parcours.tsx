"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type JSX } from "react";
import { commencerParcours, passerEtape, terminerParcours } from "@/app/bienvenue/actions";
import { ArrowLeftIcon, ArrowRightIcon, BriefcaseIcon, CalendarIcon, CameraIcon, CheckIcon, GiftIcon, MapPinIcon, SparkIcon, SpinnerIcon, TrophyIcon, type IconProps } from "@/components/app/icons";
import { AuthCountdown } from "@/components/auth/AuthCountdown";
import { plex } from "@/components/auth/polices";
import { event } from "@/lib/mock/data";
import type { EtapeEtat, EtapeId } from "@/lib/parcours";
import { EtapeEntreprise, EtapePhoto, EtapePitch, EtapeTombola, type Navigation, type ProfilEntreprise } from "./etapes";
import styles from "./parcours.module.css";

type Ecran = "intro" | EtapeId | "fin";

type ParcoursProps = {
  prenom: string;
  nom: string;
  photo: string | null;
  couverture: string | null;
  /** Inscription validée : l'espace participant s'ouvre à la fin du parcours. */
  acces: boolean;
  etapes: EtapeEtat[];
  commence: boolean;
  profil: ProfilEntreprise;
  pitch: string | null;
  tombola: string | null;
  /** Page où mène « Terminer plus tard » et la fin du parcours. */
  sortie: string;
  next: string;
  /** Secondes avant le gala, calculées par le serveur. */
  restant: number;
};

type Contenu = { photo: string; sur: string; titre: [string, string]; lead: string; points: string[]; carteSur: string; carteTitre: string };

const ETAPES: Record<EtapeId, { nom: string; court: string; duree: string; icone: (p: IconProps) => JSX.Element }> = {
  photo: { nom: "Votre photo de profil", court: "Photo", duree: "1 min", icone: CameraIcon },
  entreprise: { nom: "Vous et votre entreprise", court: "Profil", duree: "2 min", icone: BriefcaseIcon },
  pitch: { nom: "Défi 1 · Votre vidéo pitch", court: "Défi 1", duree: "1 min", icone: TrophyIcon },
  tombola: { nom: "Défi 2 · Votre publication « J’y serai »", court: "Défi 2", duree: "1 min", icone: GiftIcon },
};

// Photos de l'événement (public/traversee) : une par écran.
const CONTENU: Record<EtapeId, Contenu> = {
  photo: {
    photo: "groupe",
    sur: "Votre photo",
    titre: ["Montrez", "votre visage."],
    lead: "Votre photo apparaît dans l’annuaire, sur votre billet et sur votre affiche « J’y serai » ; votre couverture habille votre fiche. Les autres participants vous reconnaîtront le 18 décembre.",
    points: ["Un portrait net, de face, suffit", "Couverture facultative, en format large : votre équipe, vos produits, vos locaux", "Modifiables à tout moment depuis votre profil"],
    carteSur: "Photo et couverture",
    carteTitre: "Choisissez vos photos",
  },
  entreprise: {
    photo: "reseau",
    sur: "Vous et votre entreprise",
    titre: ["Présentez", "votre entreprise."],
    lead: "Vos nom, entreprise, fonction et téléphone viennent de votre inscription : vérifiez-les, puis ajoutez votre secteur et ce que vous venez chercher. C’est ce que les autres participants lisent avant de vous proposer un rendez-vous B2B.",
    points: ["Visible dans l’annuaire des participants", "Le secteur sert aux filtres de recherche", "Quelques mots de présentation suffisent"],
    carteSur: "Vous et votre entreprise",
    carteTitre: "Vos informations",
  },
  pitch: {
    photo: "pitch",
    sur: "Défi 1 · Gagnez un voyage au Canada",
    titre: ["Envoyez votre", "vidéo pitch."],
    lead: "Un mois au Canada pour le grand gagnant : une MECC 2027 complète, tous frais payés. Le jury retient 10 demi-finalistes, dévoilés le 13 décembre.",
    points: ["Une vidéo qui présente votre entreprise, hébergée sur Google Drive, YouTube, Vimeo…", "Partage réglé sur « Tous les utilisateurs disposant du lien »", "À envoyer avant le 11 décembre"],
    carteSur: "Défi 1",
    carteTitre: "Votre vidéo pitch",
  },
  tombola: {
    photo: "musique",
    sur: "Défi 2 · Gagnez 3 000 000 Ar",
    titre: ["Publiez votre", "« J’y serai »."],
    lead: "La publication qui compte le plus de réactions à la fin du vote, le 18 décembre, remporte 3 000 000 Ar. Aucun pitch à préparer.",
    points: ["Affiche et texte prêts sur la page du défi", "Publication Facebook ou Instagram, en mode Public", "Taguez la page CanCham Madagascar"],
    carteSur: "Défi 2",
    carteTitre: "Votre publication",
  },
};

const PHOTOS: Record<Ecran, string> = { intro: "hero", photo: "groupe", entreprise: "reseau", pitch: "pitch", tombola: "musique", fin: "salle" };

/** Parcours d'accueil : écran d'introduction, une carte par étape, écran final. L'étape courante vit dans l'adresse (?etape=). */
export function Parcours(props: ParcoursProps) {
  const sp = useSearchParams();
  const [statuts, setStatuts] = useState(props.etapes);
  const [commence, setCommence] = useState(props.commence);
  const [enCours, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const titreRef = useRef<HTMLHeadingElement | null>(null);
  const premierRendu = useRef(true);

  const ecrans: Ecran[] = ["intro", ...statuts.map((e) => e.id), "fin"];
  const reprise: Ecran = !commence ? "intro" : (statuts.find((e) => !e.fait && !e.passee)?.id ?? "fin");
  const demande = sp.get("etape");
  const ecran: Ecran = demande && (ecrans as string[]).includes(demande) ? (demande as Ecran) : reprise;
  const index = ecrans.indexOf(ecran);
  // Sens de l'animation de la carte : elle entre par la droite en avançant, par la gauche en revenant.
  const [dernier, setDernier] = useState(index);
  const [sens, setSens] = useState(styles.avance);
  if (index !== dernier) {
    setSens(index > dernier ? styles.avance : styles.recule);
    setDernier(index);
  }

  // À chaque changement d'écran, le focus va au titre de la carte (lecteurs d'écran, clavier).
  useEffect(() => {
    if (premierRendu.current) {
      premierRendu.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    titreRef.current?.focus({ preventScroll: true });
  }, [ecran]);

  function aller(cible: Ecran) {
    setErreur(null);
    const u = new URL(window.location.href);
    u.searchParams.set("etape", cible);
    window.history.pushState(null, "", u.toString());
  }
  const suivant = () => aller(ecrans[Math.min(index + 1, ecrans.length - 1)]);
  const precedent = () => aller(ecrans[Math.max(index - 1, 0)]);
  const marquerFaite = (id: EtapeId) => setStatuts((s) => s.map((e) => (e.id === id ? { ...e, fait: true } : e)));

  function passer(id: EtapeId) {
    startTransition(async () => {
      const { error } = await passerEtape(id);
      if (error) return setErreur(error);
      setStatuts((s) => s.map((e) => (e.id === id ? { ...e, passee: true } : e)));
      suivant();
    });
  }

  function commencer() {
    startTransition(async () => {
      const { error } = await commencerParcours();
      if (error) return setErreur(error);
      setCommence(true);
      aller(ecrans[1]);
    });
  }

  const nav = (id: EtapeId): Navigation => ({ onPrecedent: precedent, onPasser: () => passer(id), onSuivant: suivant, faite: false, enCours });
  const total = statuts.length;
  const numero = statuts.findIndex((e) => e.id === ecran) + 1;
  const initiales = `${props.prenom[0] ?? ""}${props.nom[0] ?? ""}`.toUpperCase() || "?";
  const contenu = ecran !== "intro" && ecran !== "fin" ? CONTENU[ecran] : null;
  const annonce = contenu ? `Étape ${numero} sur ${total} : ${contenu.carteTitre}` : ecran === "intro" ? "Introduction du parcours d’accueil" : "Fin du parcours d’accueil";

  return (
    <div className={`${plex.variable} ${styles.page}`}>
      <div className={styles.fond} aria-hidden>
        {(Object.keys(PHOTOS) as Ecran[])
          .filter((e) => (ecrans as string[]).includes(e))
          .map((e) => (
            <Image key={e} src={`/traversee/${PHOTOS[e]}.jpg`} alt="" fill sizes="100vw" priority={e === ecran} className={e === ecran ? styles.actif : undefined} />
          ))}
      </div>

      <header className={styles.haut}>
        <Link href={props.sortie} aria-label="La Traversée">
          <Image src="/impact261/logo-blanc.svg" alt="" width={1248} height={505} loading="eager" className={styles.logo} />
        </Link>
        <div className={styles.progres}>
          <p className={styles.progresTexte}>
            {contenu ? (
              <>
                <span>
                  Étape <b>{numero}</b> sur {total}
                </span>
                <b>{ETAPES[ecran as EtapeId].court}</b>
              </>
            ) : ecran === "intro" ? (
              <span>
                <b>{total}</b> étapes · environ {total + 1} minutes
              </span>
            ) : (
              <span>Toutes les étapes vues</span>
            )}
          </p>
          <ol className={styles.segments} aria-label="Étapes du parcours">
            {statuts.map((e) => (
              <li key={e.id} className={e.id === ecran ? styles.courant : e.fait || ecran === "fin" ? styles.fait : ""} aria-current={e.id === ecran ? "step" : undefined}>
                <i />
                <span>{ETAPES[e.id].court}</span>
              </li>
            ))}
          </ol>
        </div>
        <Link href={props.sortie} className={styles.plusTard}>
          Terminer plus tard
        </Link>
      </header>

      <main className={styles.scene}>
        <div key={ecran} className={styles.intro}>
          {ecran === "intro" ? (
            <>
              <p className={styles.sur}>Bienvenue, {props.prenom}</p>
              <h1 className={styles.titre}>
                Préparons <em>votre Traversée.</em>
              </h1>
              <p className={styles.lead}>
                {total} étapes rapides : votre photo, votre entreprise, puis vos participations aux deux défis. Chaque étape est enregistrée dès que vous passez à la suivante ; vous pouvez en sauter une, revenir en arrière ou terminer plus tard depuis votre profil.
              </p>
              {props.acces ? null : <p className={styles.lead}>Pendant ce temps, l’équipe CanCham vérifie votre inscription.</p>}
            </>
          ) : ecran === "fin" ? (
            <>
              <p className={styles.sur}>{props.acces ? "Parcours terminé" : "Profil prêt"}</p>
              <h1 className={styles.titre}>{props.acces ? <>Tout est <em>prêt.</em></> : <>Votre place <em>se prépare.</em></>}</h1>
              <p className={styles.lead}>
                {props.acces
                  ? "Tout est en place pour le 18 décembre. L’annuaire, les rendez-vous B2B, la messagerie et le programme vous attendent dans l’espace participant."
                  : "Merci ! Votre profil et vos participations sont enregistrés. L’équipe CanCham vérifie votre inscription : vous recevrez un e-mail dès que votre accès sera ouvert."}
              </p>
              <AuthCountdown target={event.date} initialRemaining={props.restant} />
              <ul className={styles.faits} aria-label="Le gala">
                <li>
                  <CalendarIcon width={18} height={18} />
                  {event.dateLabel} · {event.timeLabel}
                </li>
                <li>
                  <MapPinIcon width={18} height={18} />
                  {event.venue}, {event.city}
                </li>
              </ul>
            </>
          ) : contenu ? (
            <>
              <p className={styles.sur}>{contenu.sur}</p>
              <h1 className={styles.titre}>
                {contenu.titre[0]} <em>{contenu.titre[1]}</em>
              </h1>
              <p className={styles.lead}>{contenu.lead}</p>
              <ul className={styles.points}>
                {contenu.points.map((p) => (
                  <li key={p}>
                    <SparkIcon width={16} height={16} />
                    {p}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>

        <section key={`carte-${ecran}`} className={`${styles.carte} ${sens}`} aria-labelledby="parcours-titre">
          <p className={styles.visu} aria-live="polite">
            {annonce}
          </p>
          {ecran === "intro" ? (
            <>
              <p className={styles.carteSur}>Au programme</p>
              <h2 id="parcours-titre" ref={titreRef} tabIndex={-1} className={styles.carteTitre}>
                {total} étapes, à votre rythme
              </h2>
              <div className={styles.corps}>
                <ol className={styles.liste}>
                  {statuts.map((e) => {
                    const Icone = ETAPES[e.id].icone;
                    return (
                      <li key={e.id} className={e.fait ? styles.faite : ""}>
                        <span className={styles.icone}>{e.fait ? <CheckIcon width={18} height={18} strokeWidth={2.6} /> : <Icone width={18} height={18} />}</span>
                        <div>
                          <strong>{ETAPES[e.id].nom}</strong>
                          <small>{e.fait ? "Déjà renseigné" : ETAPES[e.id].duree}</small>
                        </div>
                      </li>
                    );
                  })}
                </ol>
                {erreur ? (
                  <p className={styles.erreur} role="alert">
                    {erreur}
                  </p>
                ) : null}
              </div>
              <div className={styles.actions}>
                <Link href={props.sortie} className={styles.secondaire}>
                  Plus tard
                </Link>
                <div className={styles.actionsDroite}>
                  <button type="button" className={styles.primaire} onClick={commencer} disabled={enCours} data-envoi={enCours}>
                    {enCours ? <SpinnerIcon width={16} height={16} className={styles.spin} /> : null}
                    Commencer
                    {enCours ? null : <ArrowRightIcon width={16} height={16} />}
                  </button>
                </div>
              </div>
            </>
          ) : ecran === "fin" ? (
            <>
              <p className={styles.carteSur}>Récapitulatif</p>
              <h2 id="parcours-titre" ref={titreRef} tabIndex={-1} className={styles.carteTitre}>
                {props.acces ? "Votre parcours d’accueil" : "Votre profil"}
              </h2>
              <div className={styles.corps}>
                <ol className={styles.liste}>
                  {statuts.map((e) => {
                    const Icone = ETAPES[e.id].icone;
                    return (
                      <li key={e.id} className={e.fait ? styles.faite : ""}>
                        <span className={styles.icone}>{e.fait ? <CheckIcon width={18} height={18} strokeWidth={2.6} /> : <Icone width={18} height={18} />}</span>
                        <div>
                          <strong>{ETAPES[e.id].nom}</strong>
                          <small>{e.fait ? "Enregistré" : "Passée · à compléter depuis votre profil"}</small>
                        </div>
                      </li>
                    );
                  })}
                </ol>
                <p className={styles.carteTexte}>Ce parcours ne s’ouvrira plus à la connexion. Vous retrouverez chaque élément dans votre profil et sur les pages des défis.</p>
              </div>
              <form action={terminerParcours} className={styles.actions}>
                <input type="hidden" name="next" value={props.next} />
                <button type="button" className={styles.secondaire} onClick={precedent}>
                  <ArrowLeftIcon width={16} height={16} />
                  Revoir
                </button>
                <div className={styles.actionsDroite}>
                  <button type="submit" className={styles.primaire}>
                    {props.acces ? "Entrer dans l’espace participant" : "J’ai compris"}
                    <ArrowRightIcon width={16} height={16} />
                  </button>
                </div>
              </form>
            </>
          ) : contenu ? (
            <>
              <p className={styles.carteSur}>{contenu.carteSur}</p>
              <h2 id="parcours-titre" ref={titreRef} tabIndex={-1} className={styles.carteTitre}>
                {contenu.carteTitre}
              </h2>
              {erreur ? (
                <p className={`${styles.erreur} mt-4`} role="alert">
                  {erreur}
                </p>
              ) : null}
              {ecran === "photo" ? <EtapePhoto photo={props.photo} couverture={props.couverture} initiales={initiales} nav={nav("photo")} onFait={() => marquerFaite("photo")} /> : null}
              {ecran === "entreprise" ? <EtapeEntreprise initial={props.profil} nav={nav("entreprise")} onFait={() => marquerFaite("entreprise")} /> : null}
              {ecran === "pitch" ? <EtapePitch lien={props.pitch} nav={nav("pitch")} onFait={() => marquerFaite("pitch")} /> : null}
              {ecran === "tombola" ? <EtapeTombola lien={props.tombola} nav={nav("tombola")} onFait={() => marquerFaite("tombola")} /> : null}
            </>
          ) : null}
        </section>
      </main>
    </div>
  );
}
