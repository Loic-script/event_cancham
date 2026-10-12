"use client";

import { ar } from "@/lib/traversee/data";
import { setTraversee, toast, useTraversee } from "@/lib/traversee/store";
import { Btn, Card, PageHead, Puce, Stat, ui } from "../ui";
import styles from "./admin.module.css";

export function AdminCommandes() {
  const { cmd } = useTraversee();
  const du = cmd.filter((c) => c.p !== "Payé").reduce((a, c) => a + c.m, 0);
  const enc = cmd.filter((c) => c.p === "Payé").reduce((a, c) => a + c.m, 0);

  function maj(id: string, patch: { p?: "Payé"; e?: "Servie" }, msg: string) {
    setTraversee((st) => ({ cmd: st.cmd.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
    toast(msg);
  }

  return (
    <>
      <PageHead title="Commandes" accent="en cours" text="Chaque commande avec le nom du client, son paiement et son service. Données d’exemple." photo="diner" />
      <div className={`${ui.g3} mb-4`}>
        <Stat label="À servir" value={cmd.filter((c) => c.e !== "Servie").length} text={`sur ${cmd.length} commandes`} />
        <Stat label="Encaissé" value={ar(enc)} text="paiements reçus" />
        <Stat label="À encaisser" value={ar(du)} text="à régler à table" />
      </div>
      <Card bleed className={ui.defile}>
        <table className={ui.tab}>
          <thead>
            <tr>
              <th>Client</th>
              <th>Commande</th>
              <th className={ui.n}>Montant</th>
              <th>Paiement</th>
              <th>Statut du paiement</th>
              <th>Service</th>
              <th>Statut du service</th>
            </tr>
          </thead>
          <tbody>
            {cmd.map((c) => (
              <tr key={c.id}>
                <td>
                  <strong className="text-graphite">{c.nom}</strong>
                </td>
                <td>{c.q}</td>
                <td className={ui.n}>{ar(c.m)}</td>
                <td>{c.moyen}</td>
                <td>
                  <div className={styles.st}>
                    <Puce tone={c.p === "Payé" ? "green" : "red"}>{c.p}</Puce>
                    {c.p !== "Payé" ? (
                      <Btn small variant="primary" onClick={() => maj(c.id, { p: "Payé" }, "Commande marquée comme payée.")}>
                        Marquer payée
                      </Btn>
                    ) : null}
                  </div>
                </td>
                <td>Table {c.t}</td>
                <td>
                  <div className={styles.st}>
                    <Puce tone={c.e === "Servie" ? "green" : "red"}>{c.e}</Puce>
                    {c.e !== "Servie" ? (
                      <Btn small onClick={() => maj(c.id, { e: "Servie" }, "Commande marquée comme servie.")}>
                        Marquer servie
                      </Btn>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
