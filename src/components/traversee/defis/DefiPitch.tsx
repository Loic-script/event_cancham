"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { envoyerPitch } from "@/app/(app)/defis/actions";
import { CheckIcon, ExternalLinkIcon, LinkIcon, PlayIcon } from "@/components/app/icons";
import { useProfile } from "@/components/profile/useProfile";
import type { MaParticipation } from "@/lib/defis";
import { toast } from "@/lib/traversee/store";
import { Btn, Card, Champ, Etapes, Note, Partie, Sur, ui } from "../ui";
import { GainPitch } from "./Tuiles";
import styles from "./defis.module.css";

export function profilComplet(me: { firstName: string; lastName: string; company: string; role: string; sector: string; photo?: string }) {
  return Boolean(me.firstName && me.lastName && me.company && me.role && me.sector && me.photo);
}

const SERVICES: { test: RegExp; nom: string }[] = [
  { test: /(^|\.)drive\.google\.com$|(^|\.)docs\.google\.com$/i, nom: "Google Drive" },
  { test: /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i, nom: "YouTube" },
  { test: /(^|\.)vimeo\.com$/i, nom: "Vimeo" },
  { test: /(^|\.)dropbox\.com$/i, nom: "Dropbox" },
  { test: /(^|\.)onedrive\.live\.com$|(^|\.)1drv\.ms$|sharepoint\.com$/i, nom: "OneDrive" },
  { test: /(^|\.)wetransfer\.com$|(^|\.)we\.tl$/i, nom: "WeTransfer" },
];

export function lienVideo(brut: string | null | undefined) {
  let texte = (brut ?? "").trim();
  if (!texte) return null;
  if (!/^https?:\/\//i.test(texte)) {
    if (!/^[\w-]+(\.[\w-]+)+(\/|$)/.test(texte)) return null;
    texte = `https://${texte}`;
  }
  let u: URL;
  try {
    u = new URL(texte);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(u.protocol) || !u.hostname.includes(".")) return null;
  const service = SERVICES.find((x) => x.test.test(u.hostname))?.nom ?? "vidéo en ligne";
  const prive = service === "Google Drive" && /\/drive\/(u\/\d+\/)?folders\//.test(u.pathname) ? "C’est un lien de dossier : partagez plutôt le lien du fichier vidéo." : null;
  return { url: u.toString(), service, prive };
}

export function DefiPitch({ monPitch, aPublie }: { monPitch: MaParticipation | null; aPublie: boolean }) {
  const me = useProfile();
  const router = useRouter();
  const [envoi, setEnvoi] = useState(false);
  const [saisie, setSaisie] = useState<string | null>(null);
  const envoyeInfo = monPitch ? lienVideo(monPitch.lien) : null;
  const lien = saisie ?? (envoyeInfo ? envoyeInfo.url : "");
  const info = lienVideo(lien);
  const envoye = Boolean(envoyeInfo && info && info.url === envoyeInfo.url);

  async function envoyer(e: FormEvent) {
    e.preventDefault();
    if (!info) {
      toast("Collez un lien valide vers votre vidéo pitch.");
      return;
    }
    setEnvoi(true);
    const { error } = await envoyerPitch(info.url);
    setEnvoi(false);
    if (error) return toast(error);
    setSaisie(null);
    toast(`Pitch envoyé : le lien ${info.service} est transmis au jury.`);
    router.refresh();
  }

  return (
    <>
      <Partie n={1} titre="Ce qu’on gagne">
        <GainPitch />
      </Partie>

      <Partie n={2} titre="Comment participer">
        <div className={ui.gLarge}>
          <Card pad bleed className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
            <Etapes
              items={[
                { titre: "Inscrivez-vous à la Traversée", fait: true, detail: "Votre billet est enregistré." },
                { titre: "Remplissez votre profil sur la plateforme", fait: profilComplet(me), detail: "Nom, entreprise, fonction, secteur et photo.", href: "/profil" },
                { titre: "Participez au défi « Gagnez 3 millions d’ariary »", fait: aPublie, detail: "Publiez votre photo « J’y serai » et enregistrez le lien.", href: "/defis/tombola", action: "Participer" },
                { titre: "Envoyez la vidéo pitch de votre entreprise", fait: Boolean(monPitch), detail: "Avant le 11 décembre." },
              ]}
            />
            {envoye && envoyeInfo ? (
              <Note tone="green">
                Pitch envoyé : votre vidéo {envoyeInfo.service} est transmise au jury.{" "}
                <a href={envoyeInfo.url} target="_blank" rel="noreferrer" className="font-bold underline">
                  Ouvrir ma vidéo
                </a>
              </Note>
            ) : (
              <Note>Collez le lien de votre vidéo pitch : Google Drive, YouTube, Vimeo, Dropbox ou OneDrive.</Note>
            )}
            <form onSubmit={(e) => void envoyer(e)} noValidate className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
              <Champ
                label="Lien de votre vidéo pitch"
                htmlFor="pitch-lien"
                hint={info?.prive ? info.prive : "Réglez le partage sur « Tous les utilisateurs disposant du lien » pour que le jury puisse la voir."}
              >
                <div className="relative">
                  <LinkIcon width={17} height={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graphite-faint" />
                  <input
                    id="pitch-lien"
                    type="url"
                    inputMode="url"
                    autoComplete="off"
                    className={`${ui.saisie} !pl-10`}
                    placeholder="https://drive.google.com/file/d/…"
                    value={lien}
                    onChange={(e) => setSaisie(e.target.value)}
                  />
                </div>
              </Champ>
              {info ? (
                <div className={styles.lienVideo}>
                  <span className={styles.lienVideoIco}>
                    <PlayIcon width={16} height={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <strong>{info.service}</strong>
                    <small>{info.url.replace(/^https?:\/\//i, "")}</small>
                  </div>
                  <a href={info.url} target="_blank" rel="noreferrer" className={styles.lienVideoOuvrir}>
                    Vérifier
                    <ExternalLinkIcon width={14} height={14} />
                  </a>
                </div>
              ) : lien.trim() ? (
                <p className="text-[13px] font-semibold text-leaf-ink">Ce lien n’est pas valide. Copiez l’adresse complète, qui commence par https://.</p>
              ) : null}
              <div className="flex flex-wrap gap-2.5">
                <Btn variant="primary" type="submit" disabled={!info || envoye || envoi}>
                  {envoye ? (
                    <>
                      <CheckIcon width={16} height={16} />
                      Pitch envoyé
                    </>
                  ) : monPitch ? (
                    "Envoyer le nouveau lien"
                  ) : (
                    "Envoyer mon pitch"
                  )}
                </Btn>
              </div>
            </form>
          </Card>
          <Card pad bleed className="grid gap-4">
            <Sur className="!mb-0">Comment le gagnant est choisi</Sur>
            <ol className={styles.selection}>
              <li>
                <b>Présélection par le jury</b>
                <span>Le jury retient 10 demi-finalistes, dévoilés à J-5, le 13 décembre.</span>
              </li>
              <li>
                <b>Premier vote des participants</b>
                <span>Les 10 demi-finalistes sont soumis au vote des participants.</span>
              </li>
              <li>
                <b>Pitch en direct</b>
                <span>Les 3 premiers pitchent pendant l’événement pour convaincre la salle.</span>
              </li>
              <li>
                <b>Second vote</b>
                <span>Un deuxième tour de vote désigne le grand gagnant avant la fin de la soirée.</span>
              </li>
            </ol>
            <Note>Seuls les participants à l’événement peuvent voter.</Note>
          </Card>
        </div>
      </Partie>

      {/* Demi-finalistes, vote du public et finale : à construire sur la base une fois la sélection du jury dévoilée (13 décembre). */}
      <Partie n={3} titre="Suivi du défi">
        <Card pad bleed className="grid gap-1.5">
          <strong className="text-graphite">Les 10 demi-finalistes seront dévoilés le 13 décembre.</strong>
          <p className="text-graphite-muted">Vous pourrez alors regarder leurs pitchs et voter pour votre projet préféré. La finale se joue en direct pendant le Gala, le 18 décembre.</p>
        </Card>
      </Partie>
    </>
  );
}
