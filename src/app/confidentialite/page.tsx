import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT, PageLegale } from "@/components/legal/PageLegale";

export const metadata: Metadata = {
  title: { absolute: "Politique de confidentialité · La Traversée" },
  description: "Comment CanCham Madagascar collecte, utilise et protège les données des participants de La Traversée.",
};

export default function ConfidentialitePage() {
  return (
    <PageLegale
      titre="Politique de confidentialité"
      intro="La Traversée est la plateforme du gala des 10 ans de la Chambre de Commerce et de Coopération Canada–Madagascar (CanCham Madagascar). Cette page explique quelles données nous collectons, pourquoi, et comment vous gardez la main dessus."
    >
      <section>
        <h2>Qui est responsable de vos données</h2>
        <p>
          <strong>CanCham Madagascar</strong>, organisatrice de La Traversée, est responsable du traitement des données collectées sur la plateforme. Pour toute question : <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        </p>
      </section>

      <section>
        <h2>Les données que nous collectons</h2>
        <ul>
          <li>
            <strong>Votre compte :</strong> prénom, nom, adresse e-mail, mot de passe (chiffré, jamais lisible), et, si vous les renseignez, entreprise, fonction, secteur, présentation, téléphone, site web, ville et photo de profil.
          </li>
          <li>
            <strong>Connexion avec Facebook ou Google :</strong> votre nom, votre adresse e-mail et l’identifiant fourni par le service, uniquement pour créer votre compte et vous connecter. Nous ne publions jamais rien en votre nom.
          </li>
          <li>
            <strong>Défi « J’y serai » :</strong> le lien de la publication que vous inscrivez et son nombre de réactions, relevé avec votre accord via Facebook Login pour établir le classement.
          </li>
          <li>
            <strong>Vos contenus :</strong> publications, photos, vidéos, messages, demandes de rendez-vous, vidéos du livre d’or et liens de pitch que vous partagez sur la plateforme.
          </li>
          <li>
            <strong>Votre billet :</strong> son code et son statut, utilisés pour le contrôle à l’entrée du gala.
          </li>
        </ul>
      </section>

      <section>
        <h2>Pourquoi nous les utilisons</h2>
        <ul>
          <li>Gérer votre inscription, votre billet et votre accès au gala.</li>
          <li>Vous faire apparaître dans l’annuaire des participants et permettre la mise en relation (messages, rendez-vous).</li>
          <li>Organiser les défis et publier leurs classements.</li>
          <li>Vous informer des annonces et du programme de l’événement.</li>
        </ul>
        <p>Nous ne vendons ni ne louons vos données, et nous ne les utilisons pas à des fins publicitaires.</p>
      </section>

      <section>
        <h2>Qui peut les voir</h2>
        <p>
          Votre profil public (nom, entreprise, fonction, secteur, présentation) est visible des participants connectés. Vos coordonnées, votre billet et vos messages privés ne sont accessibles qu’à vous, à vos interlocuteurs pour les messages, et à l’équipe d’organisation de CanCham Madagascar.
        </p>
      </section>

      <section>
        <h2>Durée de conservation</h2>
        <p>
          Vos données sont conservées tant que votre compte existe, et au plus douze mois après le gala du 18 décembre 2026. Les données obtenues via Facebook ou Google sont supprimées dès que vous supprimez votre compte ou que vous déconnectez le service.
        </p>
      </section>

      <section>
        <h2>Sécurité</h2>
        <p>
          Les échanges avec la plateforme sont chiffrés (HTTPS), les mots de passe sont stockés sous forme chiffrée et les fichiers que vous envoyez ne sont servis qu’aux personnes connectées.
        </p>
      </section>

      <section>
        <h2>Vos droits</h2>
        <p>
          Vous pouvez à tout moment consulter et corriger vos informations depuis votre profil, demander une copie de vos données, ou les supprimer. La marche à suivre est détaillée sur la page <Link href="/suppression-donnees">Suppression des données</Link>. Pour toute demande, écrivez à <a href={`mailto:${CONTACT}`}>{CONTACT}</a> : nous répondons sous 30 jours.
        </p>
      </section>
    </PageLegale>
  );
}
