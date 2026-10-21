import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT, PageLegale } from "@/components/legal/PageLegale";

export const metadata: Metadata = {
  title: { absolute: "Suppression des données · La Traversée" },
  description: "Comment supprimer votre compte La Traversée et les données associées, y compris celles obtenues via Facebook.",
};

export default function SuppressionDonneesPage() {
  return (
    <PageLegale
      titre="Suppression de vos données"
      intro="Vous pouvez supprimer à tout moment votre compte La Traversée et toutes les données qui y sont liées, y compris celles obtenues via Facebook Login."
    >
      <section>
        <h2>Supprimer votre compte vous-même</h2>
        <ol>
          <li>
            Connectez-vous sur <Link href="/connexion">La Traversée</Link>.
          </li>
          <li>Ouvrez le menu de votre compte en haut à droite, puis « Mon profil ».</li>
          <li>Tout en bas, dans « Supprimer mon compte », tapez SUPPRIMER pour confirmer.</li>
        </ol>
        <p>
          La suppression est immédiate et définitive : votre compte, votre profil, vos sessions et les informations reçues de Facebook ou de Google sont effacés.
        </p>
      </section>

      <section>
        <h2>Demander la suppression par e-mail</h2>
        <p>
          Si vous ne pouvez plus vous connecter, écrivez à <a href={`mailto:${CONTACT}?subject=Suppression%20de%20mes%20donn%C3%A9es%20La%20Travers%C3%A9e`}>{CONTACT}</a> depuis l’adresse liée à votre compte, avec l’objet « Suppression de mes données La Traversée ». Nous supprimons le compte et vous le confirmons sous 30 jours.
        </p>
      </section>

      <section>
        <h2>Retirer l’accès de La Traversée à Facebook</h2>
        <ol>
          <li>Sur Facebook, ouvrez « Paramètres et confidentialité », puis « Paramètres ».</li>
          <li>Allez dans « Applications et sites web ».</li>
          <li>Repérez l’application de La Traversée et cliquez sur « Supprimer ».</li>
        </ol>
        <p>L’application ne peut alors plus lire votre profil ni les réactions de vos publications. Pour effacer aussi les données déjà reçues, supprimez votre compte comme indiqué plus haut.</p>
      </section>

      <section>
        <h2>Ce qui est supprimé</h2>
        <ul>
          <li>Votre compte, votre profil et votre photo.</li>
          <li>Vos identifiants Facebook ou Google et le lien de votre publication « J’y serai ».</li>
          <li>Vos sessions de connexion et votre billet.</li>
        </ul>
        <p>
          Les messages déjà reçus par d’autres participants peuvent rester visibles dans leur conversation, sans lien avec votre compte. Pour toute question, consultez notre <Link href="/confidentialite">politique de confidentialité</Link>.
        </p>
      </section>
    </PageLegale>
  );
}
