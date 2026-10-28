"use client";

import { useState } from "react";
import { UserPlusIcon } from "@/components/app/icons";
import { CreerMembre } from "../annuaire/CreerMembre";
import { Modal } from "../Modal";
import { Btn, PageHead, Puce } from "../ui";
import { AdminAcces, type CompteAcces } from "./AdminAcces";

/**
 * Page « Utilisateurs » du back-office : les demandes d'accès, et un bouton « Créer un participant » qui ouvre
 * le formulaire de création dans une fenêtre (`?onglet=creer` l'ouvre d'emblée, pour les anciens liens).
 */
export function Utilisateurs({ comptes, ongletInitial }: { comptes: CompteAcces[]; ongletInitial: "acces" | "creer" }) {
  const [creer, setCreer] = useState(ongletInitial === "creer");
  const enAttente = comptes.filter((c) => c.statut === "EN_ATTENTE").length;

  function basculer(ouvert: boolean) {
    setCreer(ouvert);
    const url = new URL(window.location.href);
    if (ouvert) url.searchParams.set("onglet", "creer");
    else url.searchParams.delete("onglet");
    window.history.replaceState(window.history.state, "", url);
  }

  return (
    <>
      <PageHead
        title="Gérer les"
        accent="utilisateurs"
        text="Validez les nouveaux inscrits, retirez ou rendez un accès, ou créez vous-même un compte membre : il reçoit alors par e-mail un lien pour choisir son mot de passe."
        photo="accueil"
      >
        <Puce tone="white">{enAttente} en attente</Puce>
        <Btn variant="primary" onClick={() => basculer(true)}>
          <UserPlusIcon width={16} height={16} />
          Créer un participant
        </Btn>
      </PageHead>

      <AdminAcces comptes={comptes} integre />

      {creer ? (
        <Modal onClose={() => basculer(false)} label="Créer un participant">
          <CreerMembre integre onFermer={() => basculer(false)} />
        </Modal>
      ) : null}
    </>
  );
}
