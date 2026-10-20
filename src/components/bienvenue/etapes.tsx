"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { enregistrerPublication, envoyerPitch } from "@/app/(app)/defis/actions";
import { positionnerCouverture } from "@/app/(app)/profil/actions";
import { enregistrerEntreprise } from "@/app/bienvenue/actions";
import { ArrowLeftIcon, ArrowRightIcon, CameraIcon, CheckIcon, ExternalLinkIcon, ImageIcon, MoveVerticalIcon, SpinnerIcon } from "@/components/app/icons";
import { lienVideo } from "@/components/traversee/defis/DefiPitch";
import { envoyerCouverture } from "@/components/traversee/profil/ChoixCouverture";
import { CouvertureReglable } from "@/components/traversee/profil/CouvertureReglable";
import { envoyerPhoto } from "@/components/traversee/profil/ChoixPhotoProfil";
import { parseSocialLink } from "@/lib/social/links";
import { SECTEURS } from "@/lib/traversee/data";
import { lisImage } from "@/lib/traversee/store";
import styles from "./parcours.module.css";

/** Boutons communs aux étapes : revenir, passer, continuer. */
export type Navigation = {
  onPrecedent: () => void;
  onPasser: () => void;
  onSuivant: () => void;
  /** Étape déjà faite : « Continuer » sans rien enregistrer. */
  faite: boolean;
  enCours: boolean;
};

export function Actions({ nav, envoi = false, libelle, pret = true, formulaire }: { nav: Navigation; envoi?: boolean; libelle: string; pret?: boolean; formulaire?: string }) {
  const occupe = envoi || nav.enCours;
  return (
    <div className={styles.actions}>
      <button type="button" className={styles.secondaire} onClick={nav.onPrecedent} disabled={occupe}>
        <ArrowLeftIcon width={16} height={16} />
        Précédent
      </button>
      <div className={styles.actionsDroite}>
        {nav.faite ? null : (
          <button type="button" className={styles.passer} onClick={nav.onPasser} disabled={occupe}>
            Passer cette étape
          </button>
        )}
        {nav.faite ? (
          <button type="button" className={styles.primaire} onClick={nav.onSuivant} disabled={occupe}>
            Continuer
            <ArrowRightIcon width={16} height={16} />
          </button>
        ) : (
          <button type={formulaire ? "submit" : "button"} form={formulaire} className={styles.primaire} onClick={formulaire ? undefined : nav.onSuivant} disabled={occupe || !pret} data-envoi={envoi}>
            {envoi ? <SpinnerIcon width={16} height={16} className={styles.spin} /> : null}
            {envoi ? "Enregistrement…" : libelle}
            {envoi ? null : <ArrowRightIcon width={16} height={16} />}
          </button>
        )}
      </div>
    </div>
  );
}

export function Champ({ label, htmlFor, aide, compteur, children }: { label: string; htmlFor: string; aide?: ReactNode; compteur?: string; children: ReactNode }) {
  return (
    <div className={styles.champ}>
      <label htmlFor={htmlFor} className={styles.label}>
        {label}
        {compteur ? <small>{compteur}</small> : null}
      </label>
      {children}
      {aide ? <p className={styles.aide}>{aide}</p> : null}
    </div>
  );
}

/* ---------- Photo ---------- */

export function EtapePhoto({ photo, couverture, couverturePosition, initiales, nav, onFait }: { photo: string | null; couverture: string | null; couverturePosition: number; initiales: string; nav: Navigation; onFait: () => void }) {
  const [apercu, setApercu] = useState(photo);
  const [couv, setCouv] = useState(couverture);
  const [envoi, setEnvoi] = useState<"photo" | "couverture" | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  // Cadrage vertical de la couverture : enregistré sur le compte, réglé en faisant glisser l'image.
  const [position, setPosition] = useState(couverturePosition);
  const [positionEnregistree, setPositionEnregistree] = useState(couverturePosition);
  const [reglage, setReglage] = useState(false);

  async function enregistrerPosition() {
    setErreur(null);
    const { error } = await positionnerCouverture(position);
    setReglage(false);
    if (error) return setErreur(error);
    setPositionEnregistree(position);
  }

  /** Photo (640 px) ou couverture (1 600 px), enregistrée dès qu'elle est choisie. */
  async function choisir(quoi: "photo" | "couverture", fichier: File | undefined) {
    if (!fichier) return;
    setErreur(null);
    const dataUrl = await lisImage(fichier, quoi === "photo" ? 640 : 1600);
    if (!dataUrl) return setErreur("Cette image n’a pas pu être lue. Choisissez une photo JPEG, PNG ou WebP.");
    setEnvoi(quoi);
    try {
      if (quoi === "photo") {
        await envoyerPhoto(dataUrl);
        setApercu(dataUrl);
        onFait();
      } else {
        await envoyerCouverture(dataUrl);
        setCouv(dataUrl);
        setPosition(50);
        setPositionEnregistree(50);
      }
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "L’image n’a pas pu être enregistrée.");
    } finally {
      setEnvoi(null);
    }
  }

  const entree = (quoi: "photo" | "couverture", label: string) => (
    <input
      type="file"
      accept="image/jpeg,image/png,image/webp"
      aria-label={label}
      disabled={envoi !== null}
      onChange={(e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        void choisir(quoi, f);
      }}
    />
  );

  return (
    <>
      <div className={styles.corps}>
        <div className={styles.photoBloc}>
          <CouvertureReglable src={couv} position={position} reglage={reglage} onChange={setPosition} className={`${styles.couverture} ${reglage ? styles.couvertureReglage : ""}`} label={couv ? "Votre photo de couverture" : "Aucune photo de couverture"}>
            <div className={styles.couvertureActions}>
              {reglage ? (
                <>
                  <button type="button" className={`${styles.fichier} ${styles.fichierPetit} ${styles.fichierPrimaire}`} onClick={() => void enregistrerPosition()}>
                    Enregistrer
                  </button>
                  <button
                    type="button"
                    className={`${styles.fichier} ${styles.fichierPetit}`}
                    onClick={() => {
                      setPosition(positionEnregistree);
                      setReglage(false);
                    }}
                  >
                    Annuler
                  </button>
                </>
              ) : (
                <>
                  {couv ? (
                    <button type="button" className={`${styles.fichier} ${styles.fichierPetit}`} onClick={() => setReglage(true)} disabled={envoi !== null} aria-label="Repositionner la couverture" title="Repositionner la couverture">
                      <MoveVerticalIcon width={15} height={15} />
                    </button>
                  ) : null}
                  <label className={`${styles.fichier} ${styles.fichierPetit}`} aria-disabled={envoi !== null}>
                    {envoi === "couverture" ? <SpinnerIcon width={15} height={15} className={styles.spin} /> : <ImageIcon width={15} height={15} />}
                    {envoi === "couverture" ? "Envoi…" : couv ? "Changer la couverture" : "Ajouter une couverture"}
                    {entree("couverture", "Choisir ma photo de couverture")}
                  </label>
                </>
              )}
            </div>
          </CouvertureReglable>
          <div className={`${styles.anneau} ${styles.surCouverture} ${reglage ? styles.sansClics : ""}`}>{apercu ? <img src={apercu} alt="Votre photo de profil" /> : <span className={`${styles.initiales}`}>{initiales}</span>}</div>
          <label className={styles.fichier} aria-disabled={envoi !== null}>
            {envoi === "photo" ? <SpinnerIcon width={16} height={16} className={styles.spin} /> : <CameraIcon width={17} height={17} />}
            {envoi === "photo" ? "Envoi…" : apercu ? "Changer la photo" : "Choisir une photo"}
            {entree("photo", "Choisir ma photo de profil")}
          </label>
          <p className={styles.aide} aria-live="polite">
            {reglage ? "Glissez la couverture vers le haut ou le bas pour la placer, puis enregistrez." : "JPEG, PNG ou WebP, enregistrés dès qu’ils sont choisis. La couverture est facultative : votre équipe, vos produits, vos locaux."}
          </p>
        </div>
        {erreur ? (
          <p className={styles.erreur} role="alert">
            {erreur}
          </p>
        ) : null}
      </div>
      <Actions nav={{ ...nav, faite: Boolean(apercu) }} envoi={envoi !== null} libelle="Continuer" pret={false} />
    </>
  );
}

/* ---------- Entreprise ---------- */

export type ProfilEntreprise = { firstName: string; lastName: string; phone: string; company: string; role: string; sector: string; bio: string };

export function EtapeEntreprise({ initial, nav, onFait }: { initial: ProfilEntreprise; nav: Navigation; onFait: () => void }) {
  const [f, setF] = useState(initial);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const pret = Boolean(f.firstName.trim() && f.lastName.trim() && f.company.trim() && f.role.trim() && f.phone.trim() && f.sector);
  const maj = (k: keyof ProfilEntreprise) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  async function enregistrer(e: FormEvent) {
    e.preventDefault();
    if (!pret || envoi) return;
    setEnvoi(true);
    setErreur(null);
    const { error } = await enregistrerEntreprise({ firstName: f.firstName, lastName: f.lastName, phone: f.phone, company: f.company, role: f.role, sector: f.sector, bio: f.bio });
    setEnvoi(false);
    if (error) return setErreur(error);
    onFait();
    nav.onSuivant();
  }

  const secteurs = [...new Set([...SECTEURS, f.sector].filter(Boolean))];

  return (
    <>
      <form id="etape-entreprise" onSubmit={(e) => void enregistrer(e)} className={styles.corps} noValidate>
        <p className={styles.aide}>Ces informations viennent de votre inscription : vérifiez-les, puis complétez le secteur et votre présentation.</p>
        <div className={styles.ligne}>
          <Champ label="Prénom" htmlFor="pa-prenom">
            <input id="pa-prenom" className={styles.saisie} value={f.firstName} onChange={maj("firstName")} autoComplete="given-name" maxLength={60} required />
          </Champ>
          <Champ label="Nom" htmlFor="pa-nom">
            <input id="pa-nom" className={styles.saisie} value={f.lastName} onChange={maj("lastName")} autoComplete="family-name" maxLength={60} required />
          </Champ>
        </div>
        <Champ label="Entreprise" htmlFor="pa-entreprise">
          <input id="pa-entreprise" className={styles.saisie} value={f.company} onChange={maj("company")} autoComplete="organization" maxLength={80} required />
        </Champ>
        <div className={styles.ligne}>
          <Champ label="Votre fonction" htmlFor="pa-fonction">
            <input id="pa-fonction" className={styles.saisie} value={f.role} onChange={maj("role")} autoComplete="organization-title" maxLength={80} placeholder="Directrice générale" required />
          </Champ>
          <Champ label="Téléphone" htmlFor="pa-telephone">
            <input id="pa-telephone" className={styles.saisie} type="tel" inputMode="tel" value={f.phone} onChange={maj("phone")} autoComplete="tel" maxLength={20} placeholder="+261 34 00 000 00" required />
          </Champ>
        </div>
        <Champ label="Secteur d’activité" htmlFor="pa-secteur">
          <select id="pa-secteur" className={styles.saisie} value={f.sector} onChange={maj("sector")} required>
            <option value="">Choisir…</option>
            {secteurs.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Champ>
        <Champ label="Ce que vous venez chercher à La Traversée" htmlFor="pa-bio" compteur={`${f.bio.length} / 600`} aide="Facultatif. Partenaires, clients, financement, inspiration… Les autres participants le lisent avant de vous proposer un rendez-vous.">
          <textarea id="pa-bio" className={styles.saisie} value={f.bio} onChange={maj("bio")} maxLength={600} placeholder="Par exemple : nous cherchons un distributeur au Canada pour nos épices." />
        </Champ>
        {erreur ? (
          <p className={styles.erreur} role="alert">
            {erreur}
          </p>
        ) : null}
      </form>
      <Actions nav={{ ...nav, faite: false }} envoi={envoi} libelle="Enregistrer" pret={pret} formulaire="etape-entreprise" />
    </>
  );
}

/* ---------- Défi 1 : vidéo pitch ---------- */

export function EtapePitch({ lien, nav, onFait }: { lien: string | null; nav: Navigation; onFait: () => void }) {
  const [envoye, setEnvoye] = useState(lien);
  const [modifier, setModifier] = useState(false);
  const [saisie, setSaisie] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const info = lienVideo(saisie);
  const infoEnvoye = envoye ? lienVideo(envoye) : null;

  async function envoyer(e: FormEvent) {
    e.preventDefault();
    if (!info || envoi) return;
    setEnvoi(true);
    setErreur(null);
    const { error } = await envoyerPitch(info.url);
    setEnvoi(false);
    if (error) return setErreur(error);
    setEnvoye(info.url);
    setModifier(false);
    onFait();
    nav.onSuivant();
  }

  if (envoye && !modifier) {
    return (
      <>
        <div className={styles.corps}>
          <p className={styles.ok}>
            <CheckIcon width={18} height={18} strokeWidth={2.6} />
            <span>
              Pitch envoyé au jury{infoEnvoye ? ` (${infoEnvoye.service})` : ""} : <b>{envoye}</b>
            </span>
          </p>
          <p className={styles.aide}>
            Un nouvel envoi remplace le précédent.{" "}
            <button type="button" className={styles.lienTexte} onClick={() => setModifier(true)}>
              Changer de lien
            </button>
          </p>
        </div>
        <Actions nav={{ ...nav, faite: true }} libelle="Continuer" />
      </>
    );
  }

  return (
    <>
      <form id="etape-pitch" onSubmit={(e) => void envoyer(e)} className={styles.corps} noValidate>
        <Champ
          label="Lien de votre vidéo pitch"
          htmlFor="pa-pitch"
          aide={info?.prive ? info.prive : info ? `Lien ${info.service} reconnu. Réglez le partage sur « Tous les utilisateurs disposant du lien » pour que le jury puisse la voir.` : "Google Drive, YouTube, Vimeo, Dropbox, OneDrive ou WeTransfer."}
        >
          <input id="pa-pitch" className={styles.saisie} type="url" inputMode="url" value={saisie} onChange={(e) => setSaisie(e.target.value)} placeholder="https://drive.google.com/…" autoComplete="off" spellCheck={false} aria-invalid={saisie.trim() && !info ? true : undefined} />
        </Champ>
        {erreur ? (
          <p className={styles.erreur} role="alert">
            {erreur}
          </p>
        ) : null}
        {modifier ? (
          <p className={styles.aide}>
            <button type="button" className={styles.lienTexte} onClick={() => setModifier(false)}>
              Garder le lien déjà envoyé
            </button>
          </p>
        ) : (
          <p className={styles.aide}>Pas encore de vidéo ? Passez cette étape : vous retrouverez le défi dans le menu, avec toutes les consignes.</p>
        )}
      </form>
      <Actions nav={{ ...nav, faite: false }} envoi={envoi} libelle="Envoyer mon pitch" pret={Boolean(info && !info.prive)} formulaire="etape-pitch" />
    </>
  );
}

/* ---------- Défi 2 : publication « J'y serai » ---------- */

export function EtapeTombola({ lien, nav, onFait }: { lien: string | null; nav: Navigation; onFait: () => void }) {
  const [enregistre, setEnregistre] = useState(lien);
  const [modifier, setModifier] = useState(false);
  const [saisie, setSaisie] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const parsed = saisie.trim() ? parseSocialLink(saisie.trim()) : null;

  async function enregistrer(e: FormEvent) {
    e.preventDefault();
    if (!parsed?.ok || envoi) return;
    setEnvoi(true);
    setErreur(null);
    const { error } = await enregistrerPublication(parsed.url);
    setEnvoi(false);
    if (error) return setErreur(error);
    setEnregistre(parsed.url);
    setModifier(false);
    onFait();
    nav.onSuivant();
  }

  if (enregistre && !modifier) {
    return (
      <>
        <div className={styles.corps}>
          <p className={styles.ok}>
            <CheckIcon width={18} height={18} strokeWidth={2.6} />
            <span>
              Publication enregistrée pour le défi : <b>{enregistre}</b>
            </span>
          </p>
          <p className={styles.aide}>
            Ses réactions se relèvent depuis la page du défi.{" "}
            <button type="button" className={styles.lienTexte} onClick={() => setModifier(true)}>
              Changer de lien
            </button>
          </p>
        </div>
        <Actions nav={{ ...nav, faite: true }} libelle="Continuer" />
      </>
    );
  }

  return (
    <>
      <form id="etape-tombola" onSubmit={(e) => void enregistrer(e)} className={styles.corps} noValidate>
        <Champ label="Lien de votre publication" htmlFor="pa-tombola" aide={parsed && !parsed.ok ? null : parsed?.ok ? `${parsed.label} reconnue.` : "Copiez-le depuis le menu Partager de votre publication Facebook ou Instagram, en mode Public."}>
          <input id="pa-tombola" className={styles.saisie} type="url" inputMode="url" value={saisie} onChange={(e) => setSaisie(e.target.value)} placeholder="https://www.facebook.com/…" autoComplete="off" spellCheck={false} aria-invalid={parsed && !parsed.ok ? true : undefined} />
        </Champ>
        {erreur ? (
          <p className={styles.erreur} role="alert">
            {erreur}
          </p>
        ) : null}
        <p className={styles.aide}>
          Pas encore publié ? Votre affiche « J’y serai » et le texte à copier vous attendent sur{" "}
          <a href="/defis/tombola" target="_blank" rel="noreferrer" className={styles.lienTexte}>
            la page du défi <ExternalLinkIcon width={13} height={13} style={{ display: "inline", verticalAlign: "-2px" }} />
          </a>
          . Vous pouvez passer cette étape et y revenir plus tard.
        </p>
        {modifier ? (
          <p className={styles.aide}>
            <button type="button" className={styles.lienTexte} onClick={() => setModifier(false)}>
              Garder la publication déjà enregistrée
            </button>
          </p>
        ) : null}
      </form>
      <Actions nav={{ ...nav, faite: false }} envoi={envoi} libelle="Enregistrer" pret={Boolean(parsed?.ok)} formulaire="etape-tombola" />
    </>
  );
}
