"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { publierAnnonce, supprimerAnnonce } from "@/app/(app)/annonces/actions";
import { CameraIcon, MegaphoneIcon } from "@/components/app/icons";
import { DESTINATIONS, IMG, MODELES_ANNONCE, TYPES_ANNONCE, heureAnn, type AnnonceType } from "@/lib/traversee/data";
import type { AnnonceAdmin } from "@/lib/annonces";
import { lisImage, toast } from "@/lib/traversee/store";
import { AnnonceCard } from "../AnnonceCard";
import { Btn, Card, Champ, FileBtn, PageHead, Puce, Sur, ui } from "../ui";
import styles from "./admin.module.css";

type Brouillon = { titre: string; message: string; type: AnnonceType; cta: string; img: string };
const VIDE: Brouillon = { titre: "", message: "", type: "info", cta: "", img: "" };

/** Photo réduite dans le navigateur (data URL) envoyée au serveur ; renvoie son adresse. */
async function envoyerPhoto(dataUrl: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  const r = await fetch("/api/fil/images", { method: "POST", headers: { "Content-Type": blob.type || "image/jpeg" }, body: blob });
  const corps = (await r.json().catch(() => ({}))) as { url?: string; message?: string };
  if (!r.ok || !corps.url) throw new Error(corps.message ?? "La photo n’a pas pu être envoyée.");
  return corps.url;
}

export function HistoriqueAnnonces({ annonces }: { annonces: AnnonceAdmin[] }) {
  const router = useRouter();
  const [occupe, setOccupe] = useState<string | null>(null);

  async function renvoyer(a: AnnonceAdmin) {
    setOccupe(a.id);
    const { error } = await publierAnnonce({ titre: a.titre, message: a.message, type: a.type, cta: a.cta, image: a.img });
    setOccupe(null);
    if (error) return toast(error);
    toast("Annonce renvoyée à tous les participants.");
    router.refresh();
  }

  async function retirer(a: AnnonceAdmin) {
    setOccupe(a.id);
    const { error } = await supprimerAnnonce(a.id);
    setOccupe(null);
    if (error) return toast(error);
    toast("Annonce supprimée.");
    router.refresh();
  }

  return (
    <ul className={styles.listeAnn}>
      {annonces.length ? (
        annonces.map((a) => (
          <li key={a.id}>
            <div className="flex flex-wrap items-center gap-2">
              <Puce tone={a.type === "urgent" ? "red" : "blue"}>{TYPES_ANNONCE[a.type]}</Puce>
              <time>{heureAnn(a.t)}</time>
              <span className="text-[12.5px] text-graphite-muted">
                Vue par {a.vues} participant{a.vues > 1 ? "s" : ""}
              </span>
            </div>
            <strong>{a.titre}</strong>
            <p>{a.message}</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <Btn small onClick={() => void renvoyer(a)} disabled={occupe === a.id}>
                Renvoyer
              </Btn>
              <Btn small className="!text-[#b42318]" onClick={() => void retirer(a)} disabled={occupe === a.id}>
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

export function AdminAnnonces({ annonces }: { annonces: AnnonceAdmin[] }) {
  const router = useRouter();
  const [b, setB] = useState<Brouillon>(VIDE);
  const [envoi, setEnvoi] = useState(false);

  async function envoyer(e: FormEvent) {
    e.preventDefault();
    if (envoi) return;
    if (!b.titre.trim() || !b.message.trim()) return toast("Renseignez un titre et un message.");
    setEnvoi(true);
    try {
      const image = b.img ? await envoyerPhoto(b.img) : undefined;
      const { error } = await publierAnnonce({ titre: b.titre.trim(), message: b.message.trim(), type: b.type, cta: b.cta, image });
      if (error) throw new Error(error);
    } catch (err) {
      setEnvoi(false);
      return toast(err instanceof Error ? err.message : "L’annonce n’a pas pu être envoyée.");
    }
    setEnvoi(false);
    setB(VIDE);
    toast("Annonce envoyée : elle s’ouvre chez chaque participant à sa prochaine page.");
    router.refresh();
  }

  return (
    <>
      <PageHead title="Annonces aux" accent="participants" text="Chaque annonce s’ouvre chez chaque participant à sa prochaine page, une seule fois, puis reste consultable depuis la cloche." photo="public" />
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
          <Btn variant="primary" type="submit" disabled={envoi}>
            <MegaphoneIcon width={16} height={16} />
            {envoi ? "Envoi…" : "Envoyer à tous les participants"}
          </Btn>
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
        <HistoriqueAnnonces annonces={annonces} />
      </Card>
    </>
  );
}
