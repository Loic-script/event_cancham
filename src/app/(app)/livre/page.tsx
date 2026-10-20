import type { Metadata } from "next";
import { Livre } from "@/components/traversee/livre/Livre";
import { mesSouvenirs, souvenirsPublies } from "@/lib/livre";
import { requireMembreActif } from "@/lib/session";

export const metadata: Metadata = { title: "Livre d’or vidéo" };
export const dynamic = "force-dynamic";

export default async function LivrePage() {
  const user = await requireMembreActif();
  const [publies, miens] = await Promise.all([souvenirsPublies(), mesSouvenirs(user.id)]);
  return <Livre publies={publies} miens={miens} />;
}
