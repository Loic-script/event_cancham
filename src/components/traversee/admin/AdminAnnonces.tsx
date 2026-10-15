"use client";

import { useState, type FormEvent } from "react";
import { CameraIcon, MegaphoneIcon } from "@/components/app/icons";
import { DESTINATIONS, IMG, MODELES_ANNONCE, TYPES_ANNONCE, heureAnn, type AnnonceType } from "@/lib/traversee/data";
import { lisImage, setTraversee, toast, uid, useTraversee, type Annonce } from "@/lib/traversee/store";
import { AnnonceCard } from "../AnnonceCard";
import { Btn, Card, Champ, FileBtn, PageHead, Puce, Sur, ui } from "../ui";
import styles from "./admin.module.css";

type Brouillon = { titre: string; message: string; type: AnnonceType; cta: string; img: string };
const VIDE: Brouillon = { titre: "", message: "", type: "info", cta: "", img: "" };

export function publierAnnonce(a: Omit<Annonce, "id" | "t">) {
  setTraversee((st) => ({ annonces: [{ ...a, id: uid("a"), t: Date.now() }, ...st.annonces] }));
}

export function HistoriqueAnnonces() {
  const { annonces } = useTraversee();
  return (
    <ul className={styles.listeAnn}>
      {annonces.length ? (
        annonces.map((a) => (
          <li key={a.id}>
            <div className="flex flex-wrap items-center gap-2">
              <Puce tone={a.type === "urgent" ? "red" : "blue"}>{TYPES_ANNONCE[a.type]}</Puce>
              <time>{heureAnn(a.t)}</time>
            </div>
            <strong>{a.titre}</strong>
            <p>{a.message}</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <Btn
                small
                onClick={() => {
                  publierAnnonce({ titre: a.titre, message: a.message, type: a.type, cta: a.cta, img: a.img });
                  toast("Annonce renvoyée à tous les participants.");
                }}
              >
                Renvoyer
              </Btn>
              <Btn
                small
                onClick={() => {
                  setTraversee((st) => ({ annonces: st.annonces.filter((x) => x.id !== a.id) }));
                  toast("Annonce supprimée.");
                }}
              >
                Supprimer
              </Btn>
            </div>
          </li>
        ))
      ) : (
        <li>
          <p>Aucune annonce envoyée pour l’instant.</p>
        </li>
      )}
    </ul>
  );
}

export function AdminAnnonces() {
  const [b, setB] = useState<Brouillon>(VIDE);

  function envoyer(e: FormEvent) {
    e.preventDefault();
    if (!b.titre.trim() || !b.message.trim()) return toast("Renseignez un titre et un message.");
    publierAnnonce({ titre: b.titre.trim(), message: b.message.trim(), type: b.type, cta: b.cta, img: b.img || undefined });
    setB(VIDE);
    toast("Annonce envoyée : elle s’affiche en popup chez les participants.");
  }

  return (
    <>
      <PageHead title="Annonces aux" accent="participants" text="Chaque annonce s’affiche en popup dans l’appli de tous les participants connectés, et reste consultable depuis la cloche." photo="public" />
      <div className={ui.gLarge}>
        <form onSubmit={envoyer} className={`${ui.card} ${ui.pad} m-bleed grid gap-3.5`}>
          <Sur className="!mb-0">Nouvelle annonce</Sur>
          <div className={styles.modeles}>
            {MODELES_ANNONCE.map((m) => (
              <button key={m.titre} type="button" onClick={() => setB({ ...b, titre: m.titre, message: m.message, type: m.type, cta: m.cta })}>
                {m.titre}
              </button>
            ))}
          </div>
          <Champ label="Titre" htmlFor="an-titre">
            <input id="an-titre" className={ui.saisie} maxLength={70} required value={b.titre} onChange={(e) => setB({ ...b, titre: e.target.value })} />
          </Champ>
          <Champ label="Message" htmlFor="an-msg">
            <textarea id="an-msg" className={ui.saisie} maxLength={280} required value={b.message} onChange={(e) => setB({ ...b, message: e.target.value })} />
          </Champ>
          <div className={ui.g2}>
            <Champ label="Type" htmlFor="an-type">
              <select id="an-type" className={ui.saisie} value={b.type} onChange={(e) => setB({ ...b, type: e.target.value as AnnonceType })}>
                {(Object.keys(TYPES_ANNONCE) as AnnonceType[]).map((k) => (
                  <option key={k} value={k}>
                    {TYPES_ANNONCE[k]}
                  </option>
                ))}
              </select>
            </Champ>
            <Champ label="Lien interne (bouton vers)" htmlFor="an-cta">
              <select id="an-cta" className={ui.saisie} value={b.cta} onChange={(e) => setB({ ...b, cta: e.target.value })}>
                <option value="">Aucun lien</option>
                {DESTINATIONS.map((d) => (
                  <option key={d.href} value={d.href}>
                    {d.nom}
                  </option>
                ))}
              </select>
            </Champ>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <FileBtn
              label={
                <>
                  <CameraIcon width={16} height={16} />
                  {b.img ? "Changer la photo" : "Ajouter une photo"}
                </>
              }
              accept="image/*"
              aria-label="Photo de l’annonce"
              onChange={async (e) => {
                const u = await lisImage(e.target.files?.[0], 720);
                if (u) setB((x) => ({ ...x, img: u }));
              }}
            />
            {b.img ? <Btn onClick={() => setB({ ...b, img: "" })}>Retirer la photo</Btn> : null}
          </div>
          <Btn variant="primary" type="submit">
            <MegaphoneIcon width={16} height={16} />
            Envoyer à tous les participants
          </Btn>
          <p className="text-[13px] text-graphite-muted">Dans la vraie plateforme, cet espace est réservé à l’équipe CanCham.</p>
        </form>
        <Card pad bleed>
          <Sur>Aperçu sur téléphone</Sur>
          <div className={styles.tel}>
            <div className={styles.ecran} style={{ backgroundImage: `linear-gradient(180deg, rgba(15,29,44,.82), rgba(15,29,44,.82)), url(${IMG("hero")})` }}>
              <AnnonceCard annonce={{ ...b, img: b.img || undefined, t: 0 }} apercu />
            </div>
          </div>
        </Card>
      </div>
      <h2 className="mb-3 mt-6 font-display text-[18px] text-graphite">Annonces envoyées</h2>
      <Card pad bleed>
        <HistoriqueAnnonces />
      </Card>
    </>
  );
}
