import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LockIcon } from "@/components/app/icons";
import { Btn } from "@/components/traversee/ui";
import { sessionCourante } from "@/lib/auth/session";
import { paiementEnLigneActif } from "@/lib/paiement/prestataire";
import { prisma } from "@/lib/prisma";
import { prixLisible } from "@/lib/ressources/types";
import { reglerSimulation } from "../actions";
import styles from "@/components/bibliotheque/bibliotheque.module.css";

export const metadata: Metadata = { title: "Paiement · Ressources", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const MOYENS: Record<string, string> = { mvola: "MVola", "orange-money": "Orange Money", carte: "Carte bancaire" };

export default async function SimulationPage(props: PageProps<"/ressources/paiement/simulation">) {
  const sp = await props.searchParams;
  const reference = typeof sp.ref === "string" ? sp.ref : "";
  const session = await sessionCourante();
  if (!paiementEnLigneActif() || !session) redirect("/ressources");
  const t = await prisma.tentativePaiement.findUnique({ where: { reference }, select: { reference: true, objetTitre: true, objetId: true, montant: true, moyen: true, statut: true, utilisateurId: true } });
  if (!t || t.utilisateurId !== session.id) redirect("/ressources");
  if (t.statut !== "en_attente") redirect(`/ressources/paiement/retour?ref=${encodeURIComponent(reference)}`);
  return (
    <div className={styles.alerte}>
      <LockIcon />
      <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-leaf-ink">Prestataire de paiement · simulation</p>
      <h1>{prixLisible(t.montant)}</h1>
      <p>
        Paiement par <b>{MOYENS[t.moyen] ?? t.moyen}</b> pour la ressource « {t.objetTitre} ». Référence {t.reference}.
      </p>
      <p className="text-[13px]">Mode développement : aucun argent n’est débité. Choisissez l’issue du paiement.</p>
      <div className="flex flex-wrap justify-center gap-2">
        <form action={reglerSimulation.bind(null, t.reference, "paye")}>
          <Btn variant="primary" type="submit">
            Valider le paiement
          </Btn>
        </form>
        <form action={reglerSimulation.bind(null, t.reference, "refuse")}>
          <Btn type="submit">Refuser le paiement</Btn>
        </form>
      </div>
    </div>
  );
}
