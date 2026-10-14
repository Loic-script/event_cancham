"use client";

import { useProfile } from "@/components/profile/useProfile";
import { setTraversee, toast, useTraversee } from "@/lib/traversee/store";
import { fullName } from "@/lib/mock/data";
import { GainTombola, Tuiles, type DefiType } from "../defis/Tuiles";
import { AdminPitch } from "./AdminPitch";
import { Btn, Card, Etapes, Partie, Puce, Rang, Stat, ui } from "../ui";

export function AdminDefi({ type }: { type: DefiType }) {
  const s = useTraversee();
  const me = useProfile();

  if (type === "pitch") return <AdminPitch />;

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
