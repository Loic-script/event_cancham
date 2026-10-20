import { redirect } from "next/navigation";
import { obtenirConversationEquipe } from "@/lib/messagerie";
import { requireMembreActif } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Conversation du participant avec l'équipe CanCham (bulle d'aide, « Nouveau message »), créée au premier passage. */
export default async function EquipePage() {
  const user = await requireMembreActif();
  if (user.acces === "ADMIN") redirect("/admin/messagerie");
  redirect(`/messages/${await obtenirConversationEquipe(user.id)}`);
}
