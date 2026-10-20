"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supprimerPhotoGalerie } from "@/app/(app)/galerie/actions";
import { IMG, ajusteSousTitres } from "@/lib/traversee/data";
import type { PhotoVue } from "@/lib/traversee/galerie";
import { setTraversee, toast, useTraversee } from "@/lib/traversee/store";
import livreStyles from "../livre/livre.module.css";
import { Vignette } from "../photos/Photos";
import photosStyles from "../photos/photos.module.css";
import { Btn, Card, Champ, Onglets, PageHead, Puce, Vide, ui } from "../ui";
import { AdminPrisePhoto } from "./AdminPrisePhoto";

export function AdminPhotos({ photos }: { photos: PhotoVue[] }) {
  const router = useRouter();
  const [f, setF] = useState<"toutes" | "officielles" | "participants">("toutes");
  const [occupe, setOccupe] = useState<string | null>(null);
  const liste = photos.filter((x) => f === "toutes" || (f === "participants" ? !x.officielle : x.officielle));

  async function retirer(m: PhotoVue) {
    setOccupe(m.id);
    const { error } = await supprimerPhotoGalerie(m.id);
    setOccupe(null);
    if (error) return toast(error);
    toast("Photo supprimée de la galerie et des stories.");
    router.refresh();
  }

  return (
    <>
      <AdminPrisePhoto total={photos.length} />
      <div className={ui.outils}>
        <Onglets
          items={[
            { v: "toutes", label: "Toutes" },
            { v: "officielles", label: "Officielles" },
            { v: "participants", label: "Participants" },
          ]}
          value={f}
          onChange={setF}
          label="Filtre"
        />
      </div>
      {liste.length ? (
        <div className={photosStyles.mur}>
          {liste.map((m, i) => (
            <Vignette key={m.id} m={m} i={i} tag={{ texte: m.officielle ? "Officielle" : m.auteur, rouge: !m.officielle }}>
              <Btn small className={photosStyles.suppr} disabled={occupe === m.id} onClick={() => void retirer(m)}>
                Supprimer
              </Btn>
            </Vignette>
          ))}
        </div>
      ) : (
        <Vide>{photos.length ? "Aucune photo dans cette catégorie." : "Aucune photo dans la galerie pour l’instant. Prenez ou importez les premières ci-dessus."}</Vide>
      )}
    </>
  );
}

export function AdminLivre() {
  const s = useTraversee();
  const ordre = [...s.livre].sort((a, b) => (a.etat === "attente" ? 0 : 1) - (b.etat === "attente" ? 0 : 1));
  const attente = s.livre.filter((l) => l.etat === "attente").length;
  function maj(id: string, patch: Partial<(typeof s.livre)[number]>) {
    setTraversee((st) => ({ livre: st.livre.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  }
  return (
    <>
      <PageHead title="Livre d’or" accent="vidéo" text="Validez les souvenirs avant leur publication et ajustez les sous-titres générés automatiquement." photo="musique">
        <Puce tone="white">{attente} en attente</Puce>
      </PageHead>
      <div className="grid gap-4">
        {ordre.map((l) => (
          <Card key={l.id} bleed className={livreStyles.souvenir}>
            <div className={livreStyles.v}>
              {l.vid ? <video src={l.vid} muted /> : <img src={IMG(l.img)} alt="" loading="lazy" />}
              <span>{l.duree}</span>
            </div>
            <div className="grid gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-graphite">{l.nom}</strong>
                <Puce tone={l.etat === "valide" ? "green" : l.etat === "attente" ? "red" : "grey"}>{l.etat === "valide" ? "Publié" : l.etat === "attente" ? "En attente" : "Refusé"}</Puce>
              </div>
              <Champ label="Sous-titres" htmlFor={`st-${l.id}`}>
                <textarea
                  id={`st-${l.id}`}
                  className={ui.saisie}
                  style={{ minHeight: 70 }}
                  defaultValue={l.texte}
                  onBlur={(e) => {
                    if (e.target.value !== l.texte) {
                      maj(l.id, { texte: e.target.value });
                      toast("Sous-titres enregistrés.");
                    }
                  }}
                />
              </Champ>
              <div className="flex flex-wrap gap-2">
                <Btn
                  small
                  onClick={() => {
                    maj(l.id, { texte: ajusteSousTitres(l.texte) });
                    toast("Sous-titres ajustés automatiquement.");
                  }}
                >
                  Ajuster les sous-titres
                </Btn>
                {l.etat !== "valide" ? (
                  <Btn
                    small
                    variant="primary"
                    onClick={() => {
                      maj(l.id, { etat: "valide" });
                      toast("Souvenir publié dans le livre d’or.");
                    }}
                  >
                    Valider
                  </Btn>
                ) : null}
                {l.etat !== "refuse" ? (
                  <Btn
                    small
                    onClick={() => {
                      maj(l.id, { etat: "refuse" });
                      toast("Souvenir retiré du livre d’or.");
                    }}
                  >
                    {l.etat === "valide" ? "Retirer du livre" : "Refuser"}
                  </Btn>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
