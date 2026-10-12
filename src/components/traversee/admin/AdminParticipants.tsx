"use client";

import { useState } from "react";
import { personnes } from "@/lib/traversee/data";
import { Card, PageHead, Puce, Recherche, ui } from "../ui";

const LISTE = personnes();

export function AdminParticipants() {
  const [q, setQ] = useState("");
  const ql = q.toLowerCase().trim();
  const liste = LISTE.filter((p) => !ql || `${p.nom} ${p.ent} ${p.role} ${p.sect}`.toLowerCase().includes(ql));
  return (
    <>
      <PageHead title="Participants" accent="inscrits" text="Liste d’exemple. La vraie liste viendra de la billetterie." photo="reseau">
        <Puce tone="white">{LISTE.length} inscrits</Puce>
      </PageHead>
      <div className={ui.outils}>
        <Recherche value={q} onChange={setQ} placeholder="Rechercher un participant…" label="Rechercher un participant" className={ui.recherche} />
      </div>
      <Card bleed className={ui.defile}>
        <table className={ui.tab}>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Entreprise</th>
              <th>Rôle</th>
              <th>Secteur</th>
              <th>Billet</th>
            </tr>
          </thead>
          <tbody>
            {liste.map((p) => (
              <tr key={p.nom}>
                <td>
                  <strong className="text-graphite">{p.nom}</strong>
                </td>
                <td>{p.ent}</td>
                <td>{p.role}</td>
                <td>
                  <Puce tone="grey">{p.sect}</Puce>
                </td>
                <td>
                  <Puce tone="green">Payé</Puce>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
