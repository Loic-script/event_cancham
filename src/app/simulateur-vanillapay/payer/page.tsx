import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SIMULATEUR_ACTIF, transactionDepuisId } from "@/lib/simulateur-vanillapay";

export const metadata: Metadata = { title: "Simulateur Vanilla Pay", robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

const bouton: React.CSSProperties = { padding: "12px 18px", borderRadius: 8, border: 0, fontWeight: 700, cursor: "pointer", fontSize: 15 };

/** Simulateur : la page où le payeur « paie ». Deux boutons remplacent la saisie de carte ou de numéro mobile money. */
export default async function PayerSimulePage(props: PageProps<"/simulateur-vanillapay/payer">) {
  if (!SIMULATEUR_ACTIF) notFound();
  const { id } = await props.searchParams;
  const t = transactionDepuisId(Array.isArray(id) ? id[0] : (id ?? null));
  if (!t) notFound();
  const montant = `${String(t.montant).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} Ar`;

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 440, margin: "48px auto", padding: 24, border: "1px solid #ddd", borderRadius: 12 }}>
      <p style={{ margin: 0, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "#777" }}>Simulateur Vanilla Pay (local)</p>
      <h1 style={{ fontSize: 22, margin: "8px 0 16px" }}>Paiement de {montant}</h1>
      <p style={{ color: "#444" }}>
        Référence {t.reference} · {t.modePaiement === "international" ? "carte bancaire" : "mobile money"} · transaction {t.transaction}
      </p>
      <form method="post" action="/simulateur-vanillapay/conclure" style={{ display: "grid", gap: 10, marginTop: 20 }}>
        <input type="hidden" name="id" value={Array.isArray(id) ? id[0] : id} />
        <button type="submit" name="issue" value="succes" style={{ ...bouton, background: "#0a7a3f", color: "#fff" }}>
          Paiement réussi
        </button>
        <button type="submit" name="issue" value="echec" style={{ ...bouton, background: "#b3261e", color: "#fff" }}>
          Paiement échoué
        </button>
        <button type="submit" name="issue" value="montant" style={{ ...bouton, background: "#eee", color: "#333" }}>
          Réussi avec un montant différent (ne doit rien ouvrir)
        </button>
        <label style={{ fontSize: 13, color: "#555", display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" name="sans_notification" value="1" />
          Sans notification (la page de retour vérifie l’état elle-même)
        </label>
      </form>
    </main>
  );
}
