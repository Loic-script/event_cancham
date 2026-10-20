"use client";

import { useState, type FormEvent } from "react";
import { CheckIcon, ExternalLinkIcon, LinkIcon, PlayIcon } from "@/components/app/icons";
import { useProfile } from "@/components/profile/useProfile";
import { fullName } from "@/lib/mock/data";
import { IMG, VIGNETTES } from "@/lib/traversee/data";
import { journaliser, setTraversee, toast, useTraversee } from "@/lib/traversee/store";
import { Modal } from "../Modal";
import { Btn, Card, Champ, Direct, Etapes, Note, Partie, Puce, Sur, ui } from "../ui";
import { GainPitch } from "./Tuiles";
import { useLive } from "./live";
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

/** Demi-finalistes, vote du public et finale : à ouvrir une fois la sélection du jury dévoilée (13 décembre). */
const SUIVI_OUVERT = false;

export function DefiPitch() {
  const me = useProfile();
  const s = useTraversee();
  const inc = useLive(s.demi.length, 3);
  const incFinale = useLive(3, 5);
  const [lecteur, setLecteur] = useState<number | null>(null);
  const [saisie, setSaisie] = useState<string | null>(null);
  const envoyeInfo = s.pitchEnvoye ? lienVideo(s.pitch) : null;
  const lien = saisie ?? (envoyeInfo ? envoyeInfo.url : "");
  const info = lienVideo(lien);
  const envoye = Boolean(envoyeInfo && info && info.url === envoyeInfo.url);

  function envoyer(e: FormEvent) {
    e.preventDefault();
    if (!info) {
      toast("Collez un lien valide vers votre vidéo pitch.");
      return;
    }
    setTraversee({ pitch: info.url, pitchEnvoye: true });
    journaliser({ pour: "admin", type: "defi1", titre: `${fullName(me)} a déposé son pitch`, texte: `Défi 1 · Gagnez un voyage au Canada · vidéo ${info.service} à évaluer.`, href: "/admin/defis/pitch", acteur: fullName(me) });
    setSaisie(null);
    toast(`Pitch envoyé : le lien ${info.service} est transmis au jury.`);
  }

  const voix = s.demi.map((_, i) => (s.voix[i] ?? 0) + inc[i] + (s.vote === i ? 1 : 0));
  const total = voix.reduce((a, b) => a + b, 0);
  const pct = (i: number) => (total ? Math.round((voix[i] / total) * 100) : 0);
  const top3 = voix.map((v, i) => [v, i] as const).sort((a, b) => b[0] - a[0]).slice(0, 3).map((x) => x[1]);

  function voter(i: number) {
    const prec = s.vote;
    setTraversee({ vote: i });
    setLecteur(null);
    toast(prec === null ? `Vote enregistré pour ${s.demi[i].porteur}.` : `Vote modifié : ${s.demi[i].porteur}.`);
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
                { titre: "Participez au défi « Gagnez 3 millions d’ariary »", fait: Boolean(s.lienPub), detail: "Publiez votre photo « J’y serai » et enregistrez le lien.", href: "/defis/tombola", action: "Participer" },
                { titre: "Envoyez la vidéo pitch de votre entreprise", fait: s.pitchEnvoye, detail: "Avant le 11 décembre." },
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
            <form onSubmit={envoyer} noValidate className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
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
                <Btn variant="primary" type="submit" disabled={!info || envoye}>
                  {envoye ? (
                    <>
                      <CheckIcon width={16} height={16} />
                      Pitch envoyé
                    </>
                  ) : s.pitchEnvoye ? (
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

      <Partie n={3} titre="Suivi du défi">
        {SUIVI_OUVERT ? (
          <>
            <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="font-display text-[17px] text-graphite">
                  Les demi-finalistes <Puce tone="grey">{s.demi.length} sur 10 affichés</Puce>
                </h3>
                <p className="text-graphite-muted">
                  Regardez chaque pitch, puis votez pour un seul projet.{" "}
                  {s.vote === null ? (
                    "Vous n’avez pas encore voté."
                  ) : (
                    <>
                      Vous avez voté pour <strong className="text-graphite">{s.demi[s.vote]?.porteur}</strong>.
                    </>
                  )}
                </p>
              </div>
              <Direct>Vote du public ouvert · simulation</Direct>
            </div>
            <div className={`${styles.demis} mb-6 ${ui.stagger}`}>
              {s.demi.map((d, i) => {
                const moi = s.vote === i;
                return (
                  <Card key={`${d.ent}-${i}`} className={`${styles.demi} ${moi ? styles.choisi : ""}`} style={{ "--i": i } as React.CSSProperties}>
                    <button type="button" className={styles.miniV} style={{ backgroundImage: `linear-gradient(rgba(15,29,44,.4), rgba(22,50,84,.55)), url(${IMG(VIGNETTES[i % VIGNETTES.length])})` }} onClick={() => setLecteur(i)} aria-label={`Voir le pitch de ${d.porteur}`}>
                      <PlayIcon fill="currentColor" strokeWidth={0} />
                    </button>
                    <div className={styles.demiC}>
                      <h3>{d.porteur}</h3>
                      <p className="-mt-1 text-[13px] text-graphite-muted">{d.ent}</p>
                      <div>
                        <Puce>{d.sect}</Puce>
                      </div>
                      {s.vote !== null ? (
                        <>
                          <div className={styles.barre}>
                            <i style={{ width: `${pct(i)}%` }} />
                          </div>
                          <span className={styles.pct}>{pct(i)} % des voix</span>
                        </>
                      ) : null}
                      <Btn small variant={moi || s.vote === null ? "primary" : "light"} disabled={moi} onClick={() => voter(i)}>
                        {moi ? "✓ Votre vote" : s.vote === null ? "Voter" : "Choisir ce projet"}
                      </Btn>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="font-display text-[17px] text-graphite">La finale en direct</h3>
                <p className="text-graphite-muted">Pendant le Gala, les trois projets les plus soutenus pitchent sur scène. La salle revote et désigne le grand gagnant.</p>
              </div>
              {s.finale ? <Direct>En direct · simulation</Direct> : null}
            </div>
            {s.finale ? (
              <>
                <div className={styles.finale}>
                  {top3.map((i, k) => {
                    const moi = s.voteFinal === k;
                    return (
                      <Card key={k} className={`${styles.f} ${moi ? styles.choisi : ""}`}>
                        <img src={IMG(VIGNETTES[i % VIGNETTES.length])} alt="" />
                        <Puce tone="red">Finaliste {k + 1}</Puce>
                        <h3 className="font-display text-[17px] text-graphite">{s.demi[i]?.porteur}</h3>
                        <b>{incFinale[k] + (moi ? 1 : 0)}</b>
                        <span className={styles.pct}>voix dans la salle</span>
                        <Btn
                          variant={moi || s.voteFinal === null ? "primary" : "light"}
                          disabled={moi}
                          onClick={() => {
                            setTraversee({ voteFinal: k });
                            toast("Vote final enregistré.");
                          }}
                        >
                          {moi ? "✓ Votre vote final" : "Voter en direct"}
                        </Btn>
                      </Card>
                    );
                  })}
                </div>
                <Btn className="mt-3.5" onClick={() => setTraversee({ finale: false })}>
                  Fermer la simulation
                </Btn>
              </>
            ) : (
              <Card pad bleed className="flex flex-wrap items-center justify-between gap-3.5">
                <div>
                  <strong className="text-graphite">La finale s’ouvre le 18 décembre, pendant le Gala.</strong>
                  <p className="text-graphite-muted">Pour la maquette, vous pouvez la simuler dès maintenant.</p>
                </div>
                <Btn variant="navy" onClick={() => setTraversee({ finale: true, voteFinal: null })}>
                  Simuler la finale
                </Btn>
              </Card>
            )}
          </>
        ) : (
          <Card pad bleed className="grid gap-1.5">
            <strong className="text-graphite">Les 10 demi-finalistes seront dévoilés le 13 décembre.</strong>
            <p className="text-graphite-muted">Vous pourrez alors regarder leurs pitchs et voter pour votre projet préféré. La finale se joue en direct pendant le Gala, le 18 décembre.</p>
          </Card>
        )}
      </Partie>

      {SUIVI_OUVERT && lecteur !== null ? (
        <Modal onClose={() => setLecteur(null)} label={`Pitch de ${s.demi[lecteur].porteur}`} size="large">
          <div className={styles.lecteur} style={{ backgroundImage: `linear-gradient(rgba(15,29,44,.5), rgba(22,50,84,.6)), url(${IMG(VIGNETTES[lecteur % VIGNETTES.length])})` }}>
            <PlayIcon fill="currentColor" strokeWidth={0} />
            <span className="text-[13px] font-semibold">Vidéo de démonstration</span>
          </div>
          <div>
            <h3 className="font-display text-[20px] text-graphite">{s.demi[lecteur].porteur}</h3>
            <p className="text-graphite-muted">
              {s.demi[lecteur].ent} · {s.demi[lecteur].sect} · {s.demi[lecteur].desc}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn variant="primary" disabled={s.vote === lecteur} onClick={() => voter(lecteur)}>
              {s.vote === lecteur ? "✓ Votre vote" : "Voter pour ce projet"}
            </Btn>
            <Btn onClick={() => setLecteur(null)}>Fermer</Btn>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
