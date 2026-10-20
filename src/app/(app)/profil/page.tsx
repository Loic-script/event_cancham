import type { Metadata } from "next";
import { Profil } from "@/components/traversee/profil/Profil";
import { event } from "@/lib/mock/data";
import { etatParcours } from "@/lib/parcours";
import { requireMembreActif } from "@/lib/session";

export const metadata: Metadata = { title: "Profil" };
export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const user = await requireMembreActif();
  const maintenant = new Date();
  const restant = Math.max(0, Math.floor((new Date(event.date).getTime() - maintenant.getTime()) / 1000));
  const parcours = user.acces === "ADMIN" ? null : await etatParcours(user.id);
  return <Profil restant={restant} parcours={parcours ? { termine: parcours.termine, aCompleter: parcours.aCompleter, total: parcours.etapes.length } : null} />;
}
