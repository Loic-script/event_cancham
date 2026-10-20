"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supprimerPhotoGalerie } from "@/app/(app)/galerie/actions";
import { deciderSouvenir, modifierTexteSouvenir, supprimerSouvenir } from "@/app/(app)/livre/actions";
import { ajusteSousTitres } from "@/lib/traversee/data";
import type { PhotoVue } from "@/lib/traversee/galerie";
import { MAX_TEXTE_SOUVENIR, type SouvenirVue } from "@/lib/traversee/livre";
import { toast } from "@/lib/traversee/store";
import { Confirmer } from "../Confirmer";
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

export function AdminLivre({ souvenirs }: { souvenirs: SouvenirVue[] }) {
  const router = useRouter();
  const [occupe, setOccupe] = useState<string | null>(null);
  const [aSupprimer, setASupprimer] = useState<SouvenirVue | null>(null);
  const attente = souvenirs.filter((l) => l.etat === "attente").length;

  async function agir(l: SouvenirVue, action: () => Promise<{ error: string | null }>, ok: string) {
    setOccupe(l.id);
    const { error } = await action();
    setOccupe(null);
    if (error) return toast(error);
    toast(ok);
    router.refresh();
  }

  return (
    <>
      <PageHead title="Livre d’or" accent="vidéo" text="Validez les souvenirs des participants avant leur publication et retouchez leur message si besoin." photo="musique">
        <Puce tone="white">{attente} en attente</Puce>
      </PageHead>
      <div className="grid gap-4">
        {souvenirs.length ? (
          souvenirs.map((l) => (
            <Card key={l.id} bleed className={livreStyles.souvenir}>
              <div className={livreStyles.v}>
                <video src={l.video} controls preload="metadata" />
                {l.duree ? <span>{l.duree}</span> : null}
              </div>
              <div className="grid gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-graphite">{l.nom}</strong>
                  {l.ent ? <small className="text-graphite-muted">{l.ent}</small> : null}
                  <Puce tone={l.etat === "valide" ? "green" : l.etat === "attente" ? "red" : "grey"}>{l.etat === "valide" ? "Publié" : l.etat === "attente" ? "En attente" : "Refusé"}</Puce>
                </div>
                <Champ label="Message affiché" htmlFor={`st-${l.id}`}>
                  <textarea
                    key={l.texte}
                    id={`st-${l.id}`}
                    className={ui.saisie}
                    style={{ minHeight: 70 }}
                    maxLength={MAX_TEXTE_SOUVENIR}
                    defaultValue={l.texte}
                    onBlur={(e) => {
                      if (e.target.value.trim() !== l.texte) void agir(l, () => modifierTexteSouvenir(l.id, e.target.value), "Message enregistré.");
                    }}
                  />
                </Champ>
                <div className="flex flex-wrap gap-2">
                  <Btn small disabled={occupe === l.id || !l.texte} onClick={() => void agir(l, () => modifierTexteSouvenir(l.id, ajusteSousTitres(l.texte)), "Ponctuation et majuscules corrigées.")}>
                    Corriger la ponctuation
                  </Btn>
                  {l.etat !== "valide" ? (
                    <Btn small variant="primary" disabled={occupe === l.id} onClick={() => void agir(l, () => deciderSouvenir(l.id, "valide"), "Souvenir publié dans le livre d’or.")}>
                      Valider
                    </Btn>
                  ) : null}
                  {l.etat !== "refuse" ? (
                    <Btn small disabled={occupe === l.id} onClick={() => void agir(l, () => deciderSouvenir(l.id, "refuse"), l.etat === "valide" ? "Souvenir retiré du livre d’or." : "Souvenir refusé.")}>
                      {l.etat === "valide" ? "Retirer du livre" : "Refuser"}
                    </Btn>
                  ) : (
                    <Btn small className="!text-[#b42318]" disabled={occupe === l.id} onClick={() => setASupprimer(l)}>
                      Supprimer
                    </Btn>
                  )}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Vide>Aucun souvenir déposé pour l’instant.</Vide>
        )}
      </div>
      {aSupprimer ? (
        <Confirmer
          titre="Supprimer ce souvenir ?"
          action="Supprimer"
          enCours={occupe === aSupprimer.id}
          onConfirmer={() => void agir(aSupprimer, () => supprimerSouvenir(aSupprimer.id), "Souvenir supprimé, vidéo comprise.").then(() => setASupprimer(null))}
          onClose={() => setASupprimer(null)}
        >
          La vidéo de {aSupprimer.nom} sera effacée définitivement.
        </Confirmer>
      ) : null}
    </>
  );
}
