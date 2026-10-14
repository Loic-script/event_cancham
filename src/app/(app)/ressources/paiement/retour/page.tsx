import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckIcon, ClockIcon, XIcon } from "@/components/app/icons";
import { Btn } from "@/components/traversee/ui";
import { sessionCourante } from "@/lib/auth/session";
import { verifierAuRetour } from "@/lib/paiement/achats";
import { prisma } from "@/lib/prisma";
import styles from "@/components/bibliotheque/bibliotheque.module.css";

export const metadata: Metadata = { title: "Paiement · Ressources", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function RetourPage(props: PageProps<"/ressources/paiement/retour">) {
  const sp = await props.searchParams;
  const reference = typeof sp.ref === "string" ? sp.ref : "";
  const session = await sessionCourante();
  if (!session) redirect("/connexion");
  const t = await prisma.tentativePaiement.findUnique({ where: { reference }, select: { utilisateurId: true } });
  if (!t || t.utilisateurId !== session.id) redirect("/ressources");
  const r = await verifierAuRetour(reference);
  if (r.etat === "inconnue") redirect("/ressources");
  if (r.etat === "confirmee" || r.etat === "deja") {
    return (
      <div className={styles.alerte}>
        <CheckIcon className="!bg-[#e6f5ec] !text-palm-ink" />
        <h1>La ressource vous est ouverte</h1>
        <p>« {r.titre} » est maintenant accessible à toute votre entreprise. La facture réglée est enregistrée.</p>
        <Btn variant="primary" href={`/ressources/${r.ressourceId}`}>
          Ouvrir la ressource
        </Btn>
      </div>
    );
  }
  if (r.etat === "echouee") {
    return (
      <div className={styles.alerte}>
        <XIcon />
        <h1>Paiement refusé</h1>
        <p>Rien n’a été débité. Vous pouvez réessayer avec un autre moyen de paiement.</p>
        <Btn variant="navy" href={`/ressources/${r.ressourceId}`}>
          Retour à la ressource
        </Btn>
      </div>
    );
  }
  return (
    <div className={styles.alerte}>
      <ClockIcon />
      <h1>Paiement en cours de vérification</h1>
      <p>Le prestataire n’a pas encore confirmé le paiement. Rien n’est dû tant qu’il n’est pas confirmé.</p>
      <Btn variant="navy" href={`/ressources/paiement/retour?ref=${encodeURIComponent(reference)}`}>
        Vérifier à nouveau
      </Btn>
    </div>
  );
}
