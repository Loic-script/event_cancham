"use client";

import { useState, type FormEvent } from "react";
import { FolderIcon, PlusIcon } from "@/components/app/icons";
import { IMG, ajusteSousTitres, type Ressource } from "@/lib/traversee/data";
import { setTraversee, toast, useTraversee } from "@/lib/traversee/store";
import livreStyles from "../livre/livre.module.css";
import { Vignette, galerie } from "../photos/Photos";
import photosStyles from "../photos/photos.module.css";
import { RessourcesVue } from "../ressources/Ressources";
import { Btn, Card, Champ, Onglets, PageHead, Puce, Sur, Vide, ui } from "../ui";

export function AdminPhotos() {
  const s = useTraversee();
  const [f, setF] = useState<"toutes" | "officielles" | "participants">("toutes");
  const gal = galerie(s);
  const liste = gal.filter((x) => f === "toutes" || (f === "participants" ? x.par === "vous" : x.par === "CanCham"));
  return (
    <>
      <PageHead title="Photos et" accent="vidéos" text="Supprimez les photos et vidéos non pertinentes. Celles ajoutées par les participants sont signalées." photo="public">
        <Puce tone="white">{gal.length} éléments en ligne</Puce>
      </PageHead>
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

export function AdminRessources() {
  const s = useTraversee();
  const [dossier, setDossier] = useState({ nom: "", acces: "Tous les participants" });
  const [res, setRes] = useState<{ nom: string; type: Ressource["type"]; dossier: string }>({ nom: "", type: "PDF", dossier: s.dossiers[0]?.nom ?? "" });

  function creerDossier(e: FormEvent) {
    e.preventDefault();
    const nd = dossier.nom.trim();
    if (!nd) return;
    if (s.dossiers.some((d) => d.nom === nd)) return toast("Ce dossier existe déjà.");
    setTraversee((st) => ({ dossiers: [...st.dossiers, { nom: nd, acces: dossier.acces }] }));
    setDossier({ nom: "", acces: "Tous les participants" });
    toast("Dossier créé.");
  }

  function ajouterRes(e: FormEvent) {
    e.preventDefault();
    const nr = res.nom.trim();
    if (!nr) return;
    if (!s.dossiers.length) return toast("Créez d’abord un dossier.");
    setTraversee((st) => ({ ress: [{ nom: nr, type: res.type, dossier: res.dossier || st.dossiers[0].nom, date: Date.now() }, ...st.ress] }));
    setRes({ ...res, nom: "" });
    toast("Ressource ajoutée.");
  }

  return (
    <>
      <PageHead title="Vos" accent="ressources" text="Créez des dossiers et déposez les documents mis à disposition des participants." photo="formation" />
      <div className={`${ui.g2} mb-5`}>
        <form onSubmit={creerDossier} className={`${ui.card} ${ui.pad} m-bleed grid gap-3.5`}>
          <Sur className="!mb-0">Nouveau dossier</Sur>
          <Champ label="Nom du dossier" htmlFor="ds-nom">
            <input id="ds-nom" className={ui.saisie} required value={dossier.nom} onChange={(e) => setDossier({ ...dossier, nom: e.target.value })} />
          </Champ>
          <Champ label="Accès" htmlFor="ds-acces">
            <select id="ds-acces" className={ui.saisie} value={dossier.acces} onChange={(e) => setDossier({ ...dossier, acces: e.target.value })}>
              {["Tous les participants", "Réservé aux exposants", "Réservé aux finalistes"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Champ>
          <Btn type="submit">
            <FolderIcon width={16} height={16} />
            Créer le dossier
          </Btn>
        </form>
        <form onSubmit={ajouterRes} className={`${ui.card} ${ui.pad} m-bleed grid gap-3.5`}>
          <Sur className="!mb-0">Ajouter une ressource</Sur>
          <Champ label="Nom" htmlFor="rs-nom">
            <input id="rs-nom" className={ui.saisie} required value={res.nom} onChange={(e) => setRes({ ...res, nom: e.target.value })} />
          </Champ>
          <div className={ui.g2}>
            <Champ label="Type" htmlFor="rs-type">
              <select id="rs-type" className={ui.saisie} value={res.type} onChange={(e) => setRes({ ...res, type: e.target.value as Ressource["type"] })}>
                {["PDF", "Image", "Vidéo", "Lien"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Champ>
            <Champ label="Dossier" htmlFor="rs-dos">
              <select id="rs-dos" className={ui.saisie} value={res.dossier} onChange={(e) => setRes({ ...res, dossier: e.target.value })}>
                {s.dossiers.map((d) => (
                  <option key={d.nom}>{d.nom}</option>
                ))}
              </select>
            </Champ>
          </div>
          <Btn variant="primary" type="submit">
            <PlusIcon width={16} height={16} />
            Ajouter une ressource
          </Btn>
        </form>
      </div>
      <RessourcesVue admin />
    </>
  );
}
