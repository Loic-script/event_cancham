"use client";

import { useState, type FormEvent } from "react";
import { PlusIcon } from "@/components/app/icons";
import { useProfile } from "@/components/profile/useProfile";
import { SECTEURS } from "@/lib/traversee/data";
import { setTraversee, toast, useTraversee } from "@/lib/traversee/store";
import { fullName } from "@/lib/mock/data";
import { GainPitch, GainTombola, Tuiles, type DefiType } from "../defis/Tuiles";
import { Btn, Card, Champ, Etapes, FileBtn, Note, Partie, Puce, Rang, Stat, Sur, ui } from "../ui";

function FormDemi() {
  const s = useTraversee();
  const [f, setF] = useState({ porteur: "", ent: "", sect: SECTEURS[0], desc: "" });
  const plein = s.demi.length >= 10;
  function ajouter(e: FormEvent) {
    e.preventDefault();
    if (plein) return;
    setTraversee((st) => ({ demi: [...st.demi, { ent: f.ent.trim(), sect: f.sect, desc: f.desc.trim(), porteur: f.porteur.trim() }], voix: [...st.voix, 0] }));
    toast(`Demi-finaliste ajouté : ${s.demi.length + 1} sur 10.`);
    setF({ porteur: "", ent: "", sect: SECTEURS[0], desc: "" });
  }
  return (
    <form onSubmit={ajouter} className={`${ui.card} ${ui.pad} m-bleed grid gap-3.5`}>
      <Sur className="!mb-0">Ajouter un demi-finaliste</Sur>
      {plein ? (
        <Note>Les dix demi-finalistes sont enregistrés. Retirez-en un pour en ajouter un autre.</Note>
      ) : (
        <>
          <Champ label="Nom du porteur de projet" htmlFor="df-nom">
            <input id="df-nom" className={ui.saisie} required value={f.porteur} onChange={(e) => setF({ ...f, porteur: e.target.value })} />
          </Champ>
          <Champ label="Entreprise" htmlFor="df-ent">
            <input id="df-ent" className={ui.saisie} required value={f.ent} onChange={(e) => setF({ ...f, ent: e.target.value })} />
          </Champ>
          <Champ label="Secteur" htmlFor="df-sect">
            <select id="df-sect" className={ui.saisie} value={f.sect} onChange={(e) => setF({ ...f, sect: e.target.value })}>
              {SECTEURS.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Champ>
          <Champ label="Le projet en une phrase" htmlFor="df-desc">
            <input id="df-desc" className={ui.saisie} required value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} />
          </Champ>
          <FileBtn
            label={
              <>
                <PlusIcon width={16} height={16} />
                Joindre la vidéo du pitch
              </>
            }
            accept="video/*"
            aria-label="Vidéo du pitch"
          />
          <Btn variant="primary" type="submit">
            Ajouter aux demi-finalistes
          </Btn>
        </>
      )}
      <p className="text-[13px] text-graphite-muted">Les demi-finalistes ajoutés ici s’affichent aussitôt dans l’onglet Défis des participants, ouverts au vote.</p>
    </form>
  );
}

export function AdminDefi({ type }: { type: DefiType }) {
  const s = useTraversee();
  const me = useProfile();

  if (type === "pitch") {
    const ordre = s.voix.map((v, i) => [v, i] as const).sort((a, b) => b[0] - a[0]);
    return (
      <>
        <Tuiles actif="pitch" admin />
        <Partie n={1} titre="Ce qu’on gagne">
          <GainPitch />
        </Partie>
        <Partie n={2} titre="Comment participer">
          <Card pad bleed>
            <Etapes
              items={[
                "Le participant s’inscrit à la Traversée",
                "Il remplit son profil sur la plateforme",
                "Il participe au défi « Gagnez 3 millions d’ariary »",
                "Il envoie la vidéo pitch de son entreprise",
                "Le jury présélectionne 10 demi-finalistes, dévoilés à J-5 (13 décembre)",
                "Les 10 demi-finalistes sont soumis au vote des participants",
                "Les 3 premiers pitchent pendant l’événement, puis un second vote désigne le grand gagnant avant la fin de la soirée",
                "Seuls les participants à l’événement peuvent voter",
              ].map((titre) => ({ titre, fait: true }))}
            />
          </Card>
        </Partie>
        <Partie n={3} titre="Suivi du défi">
          <div className={`${ui.g3} mb-4`}>
            <Stat label="Demi-finalistes" value={`${s.demi.length} / 10`} text="saisis par l’équipe" />
            <Stat label="Votes du public" value={s.voix.reduce((a, b) => a + b, 0)} text="voix exprimées" />
            <Stat label="Finale" value={s.finale ? "Ouverte" : "Fermée"}>
              <Btn small variant={s.finale ? "light" : "primary"} className="mt-2" onClick={() => setTraversee({ finale: !s.finale, voteFinal: null })}>
                {s.finale ? "Fermer la finale" : "Ouvrir la finale"}
              </Btn>
            </Stat>
          </div>
          <div className={ui.gLarge}>
            <Card bleed className={ui.defile}>
              <table className={ui.tab}>
                <thead>
                  <tr>
                    <th>Rang</th>
                    <th>Demi-finaliste</th>
                    <th className={ui.n}>Voix</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {ordre.map(([v, i], k) => {
                    const d = s.demi[i];
                    return (
                      <tr key={`${d.ent}-${i}`}>
                        <td>
                          <Rang n={k + 1} />
                        </td>
                        <td>
                          <strong className="text-graphite">{d.porteur}</strong>
                          <br />
                          <small className="text-graphite-muted">
                            {d.ent} · {d.sect}
                          </small>{" "}
                          {k < 3 ? <Puce tone="red">Finaliste</Puce> : null}
                        </td>
                        <td className={ui.n}>{v}</td>
                        <td className="text-right">
                          <Btn
                            small
                            onClick={() => {
                              setTraversee((st) => ({
                                demi: st.demi.filter((_, j) => j !== i),
                                voix: st.voix.filter((_, j) => j !== i),
                                vote: st.vote === i ? null : st.vote !== null && st.vote > i ? st.vote - 1 : st.vote,
                                voteFinal: null,
                              }));
                              toast("Demi-finaliste retiré.");
                            }}
                          >
                            Retirer
                          </Btn>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
            <FormDemi />
          </div>
        </Partie>
      </>
    );
  }

  const l = [...s.classement.map((c) => ({ nom: c.nom, r: c.reactions })), ...(s.lienPub ? [{ nom: fullName(me), r: 0 }] : [])].sort((a, b) => b.r - a.r);
  return (
    <>
      <Tuiles actif="tombola" admin />
      <Partie n={1} titre="Ce qu’on gagne">
        <GainTombola />
      </Partie>
      <Partie n={2} titre="Comment participer">
        <Card pad bleed>
          <Etapes
            items={[
              "Le participant télécharge sa photo « J’y serai »",
              "Il fait une publication avec le texte fourni et le lien d’inscription",
              "Il la met en mode Public, tague la page « Chambre de Commerce et de Coopération Canada Madagascar - CanCham » (facebook.com/canchammadagascar) et invite ses amis",
              "Il copie le lien de sa publication dans l’appli",
              "Il suit l’évolution en temps réel",
              "Règle : la publication qui compte le plus de réactions à la fin du vote, pendant l’événement, gagne",
            ].map((titre) => ({ titre, fait: true }))}
          />
        </Card>
      </Partie>
      <Partie n={3} titre="Suivi du défi">
        <div className={`${ui.g3} mb-4`}>
          <Stat label="Publications suivies" value={l.length} text="participants en lice" />
          <Stat label="Réactions" value={l.reduce((a, x) => a + x.r, 0)} text="au total" />
          <Stat label="Gagnant" value={<span className="text-[20px]">{s.gagnant ?? "À désigner à la clôture"}</span>}>
            <Btn
              small
              variant="primary"
              className="mt-2"
              onClick={() => {
                const g = l[0]?.nom ?? null;
                setTraversee({ gagnant: g });
                if (g) toast(`Vote clôturé : ${g} a le plus de réactions.`);
              }}
            >
              {s.gagnant ? "Recalculer le gagnant" : "Clôturer et désigner le gagnant"}
            </Btn>
          </Stat>
        </div>
        <Card bleed className={ui.defile}>
          <table className={ui.tab}>
            <thead>
              <tr>
                <th>Rang</th>
                <th>Participant</th>
                <th className={ui.n}>Réactions</th>
              </tr>
            </thead>
            <tbody>
              {l.map((x, k) => (
                <tr key={x.nom} className={s.gagnant === x.nom ? "moi" : ""}>
                  <td>
                    <Rang n={k + 1} />
                  </td>
                  <td>
                    {x.nom} {s.gagnant === x.nom ? <Puce tone="red">Gagnant</Puce> : null}
                  </td>
                  <td className={ui.n}>{x.r}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Partie>
    </>
  );
}
