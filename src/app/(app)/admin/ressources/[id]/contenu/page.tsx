import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LayoutIcon } from "@/components/app/icons";
import { EditeurPage } from "@/components/bibliotheque/editeur/EditeurPage";
import { Btn } from "@/components/traversee/ui";
import { nettoyerBlocs } from "@/lib/ressources/blocs";
import { idValide } from "@/lib/ressources/stockage";
import { prisma } from "@/lib/prisma";
import styles from "@/components/bibliotheque/bibliotheque.module.css";

export const metadata: Metadata = { title: "Composer la page · Back-office", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ContenuPage(props: PageProps<"/admin/ressources/[id]/contenu">) {
  const { id } = await props.params;
  if (!idValide(id)) notFound();
  const r = await prisma.ressource.findUnique({ where: { id }, select: { id: true, titre: true, format: true, contenu: true } });
  if (!r) notFound();
  if (r.format !== "page") {
    return (
      <div className={styles.alerte}>
        <LayoutIcon />
        <h1>Cette ressource n’est pas une page composée</h1>
        <p>Elle a été créée à partir d’un fichier. Pour modifier son contenu, remplacez le fichier depuis la page de la ressource.</p>
        <Btn variant="navy" href={`/admin/ressources/${r.id}`}>
          Retour à la ressource
        </Btn>
      </div>
    );
  }
  return <EditeurPage key={r.id} id={r.id} titre={r.titre} blocsInitiaux={nettoyerBlocs(r.contenu)} lienRetour={`/admin/ressources/${r.id}`} />;
}
