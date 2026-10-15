"use client";

import { useState } from "react";
import { IMG, ajusteSousTitres } from "@/lib/traversee/data";
import { setTraversee, toast, useTraversee } from "@/lib/traversee/store";
import livreStyles from "../livre/livre.module.css";
import { Vignette, galerie } from "../photos/Photos";
import photosStyles from "../photos/photos.module.css";
import { Btn, Card, Champ, Onglets, PageHead, Puce, Vide, ui } from "../ui";
import { AdminPrisePhoto } from "./AdminPrisePhoto";

export function AdminPhotos() {
  const s = useTraversee();
  const [f, setF] = useState<"toutes" | "officielles" | "participants">("toutes");
  const gal = galerie(s);
  const liste = gal.filter((x) => f === "toutes" || (f === "participants" ? x.par === "vous" : x.par === "CanCham"));
  return (
    <>
      <AdminPrisePhoto total={gal.length} />
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
            <Vignette key={m.id} m={m} i={i} tag={{ texte: m.par === "vous" ? "Participant" : "Officielle", rouge: m.par === "vous" }}>
              <Btn
                small
                className={photosStyles.suppr}
                onClick={() => {
                  setTraversee((st) => ({ galSupprimees: [...st.galSupprimees, m.id], galAjoutees: st.galAjoutees.filter((x) => x.id !== m.id) }));
                  if (m.src.startsWith("/api/photos/")) void fetch(m.src, { method: "DELETE" }).catch(() => undefined);
                  toast("Élément supprimé de la galerie.");
                }}
              >
                Supprimer
              </Btn>
            </Vignette>
          ))}
        </div>
      ) : (
        <Vide>Aucun élément dans cette catégorie.</Vide>
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
