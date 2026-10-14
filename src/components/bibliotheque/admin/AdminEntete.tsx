"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CopyIcon, FolderPlusIcon, PencilIcon, PlusIcon, ScissorsIcon, TrashIcon } from "@/components/app/icons";
import { Btn } from "@/components/traversee/ui";
import { toast } from "@/lib/traversee/store";
import { supprimerDossier } from "@/app/(app)/admin/ressources/actions";
import { imageDossier } from "../liens";
import { Confirmer } from "./Confirmer";
import { ModalDossier, type DossierEditable } from "./ModalDossier";
import { ModalRessource } from "./ModalRessource";
import { ecrirePressePapier, type OptionDossier } from "./outils";
import styles from "./admin.module.css";

export function AdminEntete({ dossiers, dossierCourant }: { dossiers: OptionDossier[]; dossierCourant: string | null }) {
  const [modal, setModal] = useState<"dossier" | "ressource" | null>(null);
  return (
    <>
      <Btn onClick={() => setModal("dossier")}>
        <FolderPlusIcon width={17} height={17} />
        Nouveau dossier
      </Btn>
      <Btn variant="primary" onClick={() => setModal("ressource")}>
        <PlusIcon width={17} height={17} />
        Ajouter une ressource
      </Btn>
      {modal === "dossier" ? <ModalDossier dossiers={dossiers} parentParDefaut={dossierCourant} onClose={() => setModal(null)} /> : null}
      {modal === "ressource" ? <ModalRessource dossiers={dossiers} dossierParDefaut={dossierCourant} onClose={() => setModal(null)} /> : null}
    </>
  );
}

export function PanneauDossier({ dossier, dossiers, interdits, nbRessources, nbSousDossiers }: { dossier: DossierEditable; dossiers: OptionDossier[]; interdits: string[]; nbRessources: number; nbSousDossiers: number }) {
  const router = useRouter();
  const [modal, setModal] = useState<"modifier" | "supprimer" | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function supprimer() {
    setEnCours(true);
    const r = await supprimerDossier(dossier.id);
    setEnCours(false);
    if (!r.ok) return toast(r.message);
    toast("Dossier supprimé : son contenu remonte d’un niveau.");
    router.push(r.id ? `/admin/ressources?dossier=${r.id}` : "/admin/ressources");
  }

  function presse(mode: "couper" | "copier") {
    ecrirePressePapier({ mode, ressources: [], dossiers: [dossier.id], libelle: `Dossier « ${dossier.nom} »` });
    toast(mode === "couper" ? "Dossier coupé : ouvrez la destination puis « Coller ici »." : "Dossier copié : ouvrez la destination puis « Coller ici ».");
  }

  return (
    <div className={styles.panneau}>
      <div className={styles.panneauCouv}>{dossier.couverture ? <img src={imageDossier(dossier.id, "couverture")} alt="" /> : null}</div>
      <div className="min-w-0">
        <strong>{dossier.nom}</strong>
        <p>
          {nbRessources} ressource{nbRessources > 1 ? "s" : ""} dans ce dossier
          {nbSousDossiers ? ` · ${nbSousDossiers} sous-dossier${nbSousDossiers > 1 ? "s" : ""}` : ""}
        </p>
        <p>{dossier.auteurNom ? `Auteur : ${dossier.auteurNom}` : "Sans auteur"}</p>
      </div>
      <div className={styles.panneauActions}>
        <button type="button" className={styles.outil} onClick={() => setModal("modifier")}>
          <PencilIcon width={15} height={15} />
          Modifier
        </button>
        <button type="button" className={styles.outil} onClick={() => presse("couper")}>
          <ScissorsIcon width={15} height={15} />
          Couper le dossier
        </button>
        <button type="button" className={styles.outil} onClick={() => presse("copier")}>
          <CopyIcon width={15} height={15} />
          Copier le dossier
        </button>
        <button type="button" className={`${styles.outil} ${styles.outilDanger}`} onClick={() => setModal("supprimer")}>
          <TrashIcon width={15} height={15} />
          Supprimer le dossier
        </button>
      </div>
      {modal === "modifier" ? <ModalDossier dossiers={dossiers} parentParDefaut={dossier.parentId} dossier={dossier} interdits={interdits} onClose={() => setModal(null)} /> : null}
      {modal === "supprimer" ? (
        <Confirmer titre="Supprimer ce dossier ?" action="Supprimer le dossier" onConfirmer={supprimer} onClose={() => setModal(null)} enCours={enCours}>
          <p>
            Le dossier « {dossier.nom} » sera supprimé. Ses {nbRessources} ressource{nbRessources > 1 ? "s" : ""} et ses sous-dossiers ne sont pas effacés : ils remontent d’un niveau.
          </p>
        </Confirmer>
      ) : null}
    </div>
  );
}

