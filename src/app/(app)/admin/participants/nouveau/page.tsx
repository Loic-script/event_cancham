import { redirect } from "next/navigation";

/** La création d'un compte est dans la page « Utilisateurs ». */
export default function Page() {
  redirect("/admin/utilisateurs?onglet=creer");
}
