"use client";

import { useState } from "react";
import { CreerMembre } from "../annuaire/CreerMembre";
import { Onglets, PageHead, Puce } from "../ui";
import { AdminAcces, type CompteAcces } from "./AdminAcces";

type Onglet = "acces" | "creer";

/** Page « Utilisateurs » du back-office : les demandes d'accès et la création d'un compte, en deux onglets (`?onglet=creer`). */
export function Utilisateurs({ comptes, ongletInitial }: { comptes: CompteAcces[]; ongletInitial: Onglet }) {
  const [onglet, setOnglet] = useState<Onglet>(ongletInitial);
  const enAttente = comptes.filter((c) => c.statut === "EN_ATTENTE").length;

  function changer(v: Onglet) {
    setOnglet(v);
    // L'onglet vit dans l'adresse : un lien direct (e-mail, menu) peut viser l'un ou l'autre.
    const url = new URL(window.location.href);
    if (v === "creer") url.searchParams.set("onglet", "creer");
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
      </PageHead>

      <Onglets
        label="Utilisateurs"
        value={onglet}
        onChange={changer}
        items={[
          { v: "acces", label: enAttente ? `Demandes d’accès (${enAttente})` : "Demandes d’accès" },
          { v: "creer", label: "Créer un compte" },
        ]}
      />

      {onglet === "acces" ? <AdminAcces comptes={comptes} integre /> : <CreerMembre integre />}
    </>
  );
}
