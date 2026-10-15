"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ImageIcon, LayoutIcon, PencilIcon, RefreshIcon, SpinnerIcon, TrashIcon, UploadIcon } from "@/components/app/icons";
import { toast } from "@/lib/traversee/store";
import { supprimerRessources } from "@/app/(app)/admin/ressources/actions";
import { Confirmer } from "./Confirmer";
import { ModalRessource, type RessourceEditable } from "./ModalRessource";
import { TAILLE_MAX_ENVOI, televerser, type OptionDossier } from "./outils";
import styles from "./admin.module.css";

type Props = { ressource: RessourceEditable & { format: string }; dossiers: OptionDossier[]; fichierManquant: boolean };

const ACCEPTE = ".pdf,.docx,.mp4,.jpg,.jpeg,.png,.webp";

export function OutilsRessource({ ressource, dossiers, fichierManquant }: Props) {
  const router = useRouter();
  const [modal, setModal] = useState<"modifier" | "supprimer" | null>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [enCours, setEnCours] = useState(false);
  const champ = useRef<HTMLInputElement | null>(null);

  async function remplacer(f: File | undefined) {
    if (!f) return;
    if (f.size > TAILLE_MAX_ENVOI) return toast("Fichier trop volumineux : 490 Mo maximum.");
    setPct(0);
    const r = await televerser(`/api/admin/ressources/${ressource.id}/fichier`, "PUT", f, { "x-nom-fichier": encodeURIComponent(f.name) }, setPct);
    setPct(null);
    if (champ.current) champ.current.value = "";
    if (r.statut >= 300) return toast(r.corps.message ?? "Le remplacement a échoué.");
    toast("Fichier remplacé.");
    router.refresh();
  }

  async function couvertureAuto() {
    const r = await fetch(`/api/admin/ressources/${ressource.id}/couverture`, { method: "DELETE" });
    toast(r.ok ? "Couverture automatique rétablie." : "Action impossible.");
    router.refresh();
  }

  async function supprimer() {
    setEnCours(true);
    const r = await supprimerRessources([ressource.id]);
    setEnCours(false);
    if (!r.ok) return toast(r.message);
    toast("Ressource supprimée.");
    router.push(ressource.dossierId ? `/admin/ressources?dossier=${ressource.dossierId}` : "/admin/ressources");
  }

  return (
    <>
      <div className={styles.outilsLecture}>
        <small>Outils de l’équipe</small>
        <button type="button" className={styles.outil} onClick={() => setModal("modifier")}>
          <PencilIcon width={15} height={15} />
          Modifier
        </button>
        {ressource.format === "page" ? (
          <Link href={`/admin/ressources/${ressource.id}/contenu`} className={`${styles.outil} ${styles.outilOrange}`}>
            <LayoutIcon width={15} height={15} />
            Composer la page
          </Link>
        ) : null}
        <button type="button" className={styles.outil} disabled={pct !== null} onClick={() => champ.current?.click()}>
          {pct !== null ? <SpinnerIcon width={15} height={15} className="animate-spin" /> : <UploadIcon width={15} height={15} />}
          {pct !== null ? (pct < 100 ? `Envoi ${pct} %` : "Conversion…") : ressource.format === "page" ? "Remplacer par un fichier" : "Remplacer le fichier"}
        </button>
        <input ref={champ} type="file" accept={ACCEPTE} className="sr-only" onChange={(e) => remplacer(e.target.files?.[0])} />
        {ressource.couverturePerso ? (
          <button type="button" className={styles.outil} onClick={couvertureAuto}>
            <RefreshIcon width={15} height={15} />
            Couverture automatique
          </button>
        ) : (
          <button type="button" className={styles.outil} onClick={() => setModal("modifier")}>
            <ImageIcon width={15} height={15} />
            Couverture
          </button>
        )}
        <button type="button" className={`${styles.outil} ${styles.outilDanger}`} onClick={() => setModal("supprimer")}>
          <TrashIcon width={15} height={15} />
          Supprimer
        </button>
      </div>
      {fichierManquant ? <p className={`${styles.erreur} mb-4`}>Fichier manquant : cette ressource n’a pas de contenu lisible. Remplacez le fichier ou composez la page.</p> : null}
      {modal === "modifier" ? <ModalRessource dossiers={dossiers} dossierParDefaut={ressource.dossierId} ressource={ressource} onClose={() => setModal(null)} /> : null}
      {modal === "supprimer" ? (
        <Confirmer titre="Supprimer cette ressource ?" action="Supprimer" onConfirmer={supprimer} onClose={() => setModal(null)} enCours={enCours}>
          <p>« {ressource.titre} » et ses fichiers convertis seront effacés définitivement.</p>
        </Confirmer>
      ) : null}
    </>
  );
}
