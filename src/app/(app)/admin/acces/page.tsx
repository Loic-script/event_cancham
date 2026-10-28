import { redirect } from "next/navigation";

/** Les demandes d'accès sont dans la page « Utilisateurs ». */
export default function Page() {
  redirect("/admin/utilisateurs");
}
