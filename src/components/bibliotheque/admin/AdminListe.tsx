"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type DragEvent } from "react";
import { ArrowDownIcon, ArrowUpIcon, BookIcon, ClipboardIcon, CopyIcon, GripIcon, PencilIcon, ScissorsIcon, TrashIcon, XIcon } from "@/components/app/icons";
import { toast } from "@/lib/traversee/store";
import type { CarteRessource } from "@/lib/ressources/requetes";
import { coller, reordonner, supprimerRessources } from "@/app/(app)/admin/ressources/actions";
import { LigneRessourceUI } from "../Cartes";
import { Confirmer } from "./Confirmer";
import { ModalRessource, type RessourceEditable } from "./ModalRessource";
import { ecrirePressePapier, usePressePapier, type OptionDossier } from "./outils";
import base from "../bibliotheque.module.css";
import styles from "./admin.module.css";

type Props = {
  ressources: CarteRessource[];
  dossierCourant: string | null;
  dossiers: OptionDossier[];
  ordreManuel: boolean;
  numeroter: boolean;
};

export function AdminListe({ ressources, dossierCourant, dossiers, ordreManuel, numeroter }: Props) {
  const router = useRouter();
  const presse = usePressePapier();
  const [ordre, setOrdre] = useState(() => ressources.map((r) => r.id));
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [glisse, setGlisse] = useState<string | null>(null);
  const [cible, setCible] = useState<string | null>(null);
  const [edition, setEdition] = useState<RessourceEditable | null>(null);
  const [aSupprimer, setASupprimer] = useState<string[] | null>(null);
  const [enCours, setEnCours] = useState(false);

  const parId = new Map(ressources.map((r) => [r.id, r]));
  const liste = ordre.map((id) => parId.get(id)).filter((r): r is CarteRessource => Boolean(r));
  const tout = liste.length > 0 && liste.every((r) => selection.has(r.id));

  function basculer(id: string) {
    setSelection((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function appliquerOrdre(nouvel: string[]) {
    const precedent = ordre;
    setOrdre(nouvel);
    const r = await reordonner(dossierCourant, nouvel);
    if (!r.ok) {
      setOrdre(precedent);
      toast(r.message);
    }
  }

  function deplacer(id: string, sens: -1 | 1) {
    const i = ordre.indexOf(id);
    const j = i + sens;
    if (i < 0 || j < 0 || j >= ordre.length) return;
    const n = [...ordre];
    [n[i], n[j]] = [n[j], n[i]];
    void appliquerOrdre(n);
  }

  function deposer(e: DragEvent, surId: string) {
    e.preventDefault();
    const source = glisse;
    setGlisse(null);
    setCible(null);
    if (!source || source === surId) return;
    const n = ordre.filter((x) => x !== source);
    n.splice(n.indexOf(surId), 0, source);
    void appliquerOrdre(n);
  }

  function mettre(mode: "couper" | "copier") {
    const ids = liste.filter((r) => selection.has(r.id)).map((r) => r.id);
    if (!ids.length) return;
    ecrirePressePapier({ mode, ressources: ids, dossiers: [], libelle: `${ids.length} ressource${ids.length > 1 ? "s" : ""}` });
    toast(`${ids.length} ressource${ids.length > 1 ? "s" : ""} ${mode === "couper" ? "coupée" : "copiée"}${ids.length > 1 ? "s" : ""} : ouvrez la destination puis « Coller ici ».`);
    setSelection(new Set());
  }

  async function collerIci() {
    if (!presse) return;
    setEnCours(true);
    const r = await coller({ mode: presse.mode, ressources: presse.ressources, dossiers: presse.dossiers }, dossierCourant);
    setEnCours(false);
    toast(r.ok ? (r.message ?? "Collé.") : r.message);
    if (r.ok && presse.mode === "couper") ecrirePressePapier(null);
    router.refresh();
  }

  async function supprimer() {
    if (!aSupprimer) return;
    setEnCours(true);
    const r = await supprimerRessources(aSupprimer);
    setEnCours(false);
    setASupprimer(null);
    toast(r.ok ? (r.message ?? "Supprimé.") : r.message);
    setSelection(new Set());
    router.refresh();
  }

  const nbSel = liste.filter((r) => selection.has(r.id)).length;

  return (
    <>
      <div className={styles.barre}>
        <label className={`${styles.outil} cursor-pointer`}>
          <input type="checkbox" className={styles.case} checked={tout} onChange={() => setSelection(tout ? new Set() : new Set(liste.map((r) => r.id)))} disabled={!liste.length} />
          Tout sélectionner
        </label>
        <small>{nbSel ? `${nbSel} sélectionnée${nbSel > 1 ? "s" : ""} · puis :` : "puis :"}</small>
        <button type="button" className={styles.outil} disabled={!nbSel} onClick={() => mettre("copier")}>
          <CopyIcon width={15} height={15} />
          Copier
        </button>
        <button type="button" className={styles.outil} disabled={!nbSel} onClick={() => mettre("couper")}>
          <ScissorsIcon width={15} height={15} />
          Couper
        </button>
        <button type="button" className={`${styles.outil} ${styles.outilDanger}`} disabled={!nbSel} onClick={() => setASupprimer(liste.filter((r) => selection.has(r.id)).map((r) => r.id))}>
          <TrashIcon width={15} height={15} />
          Supprimer
        </button>
        {presse ? (
          <>
            <span className={styles.sep} aria-hidden />
            <span className={styles.presse}>
              {presse.mode === "couper" ? "Coupé" : "Copié"} : {presse.libelle}
              <button type="button" aria-label="Vider le presse-papiers" onClick={() => ecrirePressePapier(null)}>
                <XIcon width={13} height={13} />
              </button>
            </span>
            <button type="button" className={`${styles.outil} ${styles.outilOrange}`} disabled={enCours} onClick={collerIci}>
              <ClipboardIcon width={15} height={15} />
              Coller ici
            </button>
          </>
        ) : null}
      </div>

      {liste.length ? (
        <div className={base.liste}>
          {liste.map((r, i) => (
            <div
              key={r.id}
              className={`${glisse === r.id ? styles.glisse : ""} ${cible === r.id && glisse !== r.id ? styles.cible : ""} ${selection.has(r.id) ? styles.selectionnee : ""}`}
              draggable={ordreManuel}
              onDragStart={(e) => {
                setGlisse(r.id);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", r.id);
              }}
              onDragEnd={() => {
                setGlisse(null);
                setCible(null);
              }}
              onDragOver={(e) => {
                if (!glisse) return;
                e.preventDefault();
                setCible(r.id);
              }}
              onDrop={(e) => deposer(e, r.id)}
            >
              <LigneRessourceUI
                r={r}
                lien={`/admin/ressources/${r.id}`}
                i={i}
                numero={numeroter ? i + 1 : undefined}
                equipe
                avant={
                  <span className={styles.ligneAdmin}>
                    {ordreManuel ? (
                      <>
                        <span className={styles.poignee} title="Glisser pour réordonner" aria-hidden>
                          <GripIcon width={18} height={18} />
                        </span>
                        <span className={styles.monter}>
                          <button type="button" aria-label="Monter" disabled={i === 0} onClick={() => deplacer(r.id, -1)}>
                            <ArrowUpIcon width={13} height={13} />
                          </button>
                          <button type="button" aria-label="Descendre" disabled={i === liste.length - 1} onClick={() => deplacer(r.id, 1)}>
                            <ArrowDownIcon width={13} height={13} />
                          </button>
                        </span>
                      </>
                    ) : null}
                    <input type="checkbox" className={styles.case} checked={selection.has(r.id)} onChange={() => basculer(r.id)} aria-label={`Sélectionner ${r.titre}`} />
                  </span>
                }
                actions={
                  <>
                    <Link href={`/admin/ressources/${r.id}`} className={styles.icone} aria-label="Lire" title="Lire">
                      <BookIcon width={17} height={17} />
                    </Link>
                    <button
                      type="button"
                      className={styles.icone}
                      aria-label="Modifier"
                      title="Modifier"
                      onClick={() => setEdition({ id: r.id, titre: r.titre, categorie: r.categorie, description: r.description, dossierId: r.dossierId, couverture: r.couverture, couverturePerso: r.couverturePerso })}
                    >
                      <PencilIcon width={16} height={16} />
                    </button>
                    <button type="button" className={`${styles.icone} ${styles.iconeDanger}`} aria-label="Supprimer" title="Supprimer" onClick={() => setASupprimer([r.id])}>
                      <TrashIcon width={16} height={16} />
                    </button>
                  </>
                }
              />
            </div>
          ))}
        </div>
      ) : (
        <div className={base.vide}>
          <ClipboardIcon />
          <p>Aucune ressource ici. Ajoutez-en une ou collez des éléments coupés ou copiés.</p>
        </div>
      )}
      {!ordreManuel && liste.length > 1 ? <p className="mt-2 text-[12.5px] text-graphite-muted">Choisissez le tri « Ordre du parcours » dans un dossier pour réordonner par glisser-déposer.</p> : null}

      {edition ? <ModalRessource dossiers={dossiers} dossierParDefaut={dossierCourant} ressource={edition} onClose={() => setEdition(null)} /> : null}
      {aSupprimer ? (
        <Confirmer titre={aSupprimer.length > 1 ? `Supprimer ${aSupprimer.length} ressources ?` : "Supprimer cette ressource ?"} action="Supprimer" onConfirmer={supprimer} onClose={() => setASupprimer(null)} enCours={enCours}>
          <p>Les fichiers convertis et la progression des lecteurs seront effacés. Cette action est définitive.</p>
        </Confirmer>
      ) : null}
    </>
  );
}
