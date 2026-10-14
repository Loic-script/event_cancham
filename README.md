# Event

Application [Next.js 16](https://nextjs.org) (App Router, TypeScript, Tailwind CSS) connectée à une base **PostgreSQL 17** via [Prisma 7](https://www.prisma.io).

## Prérequis

- Node.js 20+ (testé avec Node 24)
- PostgreSQL 17 en service local sur le port 5432

## Mise en route

1. **Configurer la connexion** : ouvrez `.env` et remplacez `VOTRE_MOT_DE_PASSE` par le mot de passe de l'utilisateur `postgres` (celui choisi à l'installation de PostgreSQL).

   ```env
   DATABASE_URL="postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/event_db?schema=public"
   ```

2. **Créer la base et les tables** (la base `event_db` est créée automatiquement si elle n'existe pas) :

   ```bash
   npm run db:migrate
   ```

3. **Insérer des données d'exemple** (optionnel) :

   ```bash
   npm run db:seed
   ```

4. **Lancer le serveur de développement** :

   ```bash
   npm run dev
   ```

   Ouvrez [http://localhost:3000](http://localhost:3000).

## Scripts

| Commande              | Rôle                                                       |
| --------------------- | ---------------------------------------------------------- |
| `npm run dev`         | Serveur de développement                                   |
| `npm run build`       | Build de production                                        |
| `npm run start`       | Serveur de production (après `build`)                      |
| `npm run lint`        | ESLint                                                     |
| `npm run db:generate` | Régénère le client Prisma après modification du schéma     |
| `npm run db:migrate`  | Crée une migration à partir du schéma et l'applique        |
| `npm run db:seed`     | Exécute `prisma/seed.ts`                                   |
| `npm run db:studio`   | Interface web Prisma Studio pour parcourir les données     |

## Espace participant

Plateforme du gala **La Traversée · Gala des 10 ans** (CanCham Madagascar, 18 décembre 2026). Pensée d'abord pour le téléphone, utilisé pendant la soirée, sans négliger l'ordinateur.

| Route            | Rôle                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------- |
| `/`              | Accueil : compte à rebours, raccourcis, derniers échos du fil                            |
| `/billet`        | Billet d'entrée présenté dans une maquette de téléphone (QR code, identifiant, titulaire), plein écran, partage et téléchargement |
| `/communaute`    | Fil de communauté : publications, défis relevés, annuaire des participants avec recherche |
| `/messages`      | Messagerie façon Messenger : liste, puis `/messages/[id]` avec émojis et messages vocaux |
| `/profil`        | Profil et réglages : identité, lignes modifiables (nom, bio, entreprise, ville, liens, e-mail, mot de passe, bloqués), mes défis, mes publications |
| `/defis`         | Page d'accroche des défis façon landing (héros, collage de photos, ruban, trois affiches) ; `/defis/[slug]` redirige vers `/decouvrir/[slug]` |
| `/decouvrir`     | Espace immersif « Découvrir les défis », hors coquille, et `/decouvrir/[slug]` : détail, règles, étapes et participation |
| `/reseaux`       | Réseaux sociaux : publications des participants pour les défis, relevées sur Facebook et Instagram |
| `/events`        | Liste technique des événements lus en base (hors espace participant)                     |

- **Navigation** : barre d'onglets en bas sur mobile (Accueil, Fil, Billet au centre, Messages, Profil) et menu « Plus » pour Les défis et Réseaux sociaux ; sur ordinateur, barre latérale avec les sept rubriques (pastille active qui glisse d'une entrée à l'autre, tuile d'icône en dégradé pour la page courante, entrée en cascade, flèche au survol, badge des messages non lus qui pulse), en-tête avec recherche globale (raccourci `/`, envoie vers l'annuaire des participants filtré) et, à partir de 1280 px, colonne de droite avec la carte du billet (chiffres clés et QR code, qui mène au billet en grand), les nouveaux participants et les réseaux de CanCham. Coquille dans `src/components/app/AppShell.tsx`, colonne de droite dans `RightPanel.tsx`.
- **Accueil** : bannière héros claire (blanc teinté de rouge et de vert, texte bleu nuit) avec compte à rebours en direct (tuiles jours, heures, minutes, secondes ; `src/components/app/Countdown.tsx`, valeur initiale calculée par le serveur pour éviter tout décalage d'hydratation), « Stories des défis » (bandeau façon réseau social : les photos de défi des participants, avatar cerclé, flèches sur ordinateur, visionneur plein écran avec barres de progression, défilement automatique, zones tactiles, flèches du clavier, flèches rondes précédente/suivante et lien « Voir la publication » qui mène à la publication correspondante sur la page Réseaux sociaux), « Populaire en ce moment » (raccourcis à visuels contextuels), « Derniers échos » ; sur écran étroit, les blocs de la colonne de droite s'affichent en bas de page. Les stories de démonstration sont dans `src/lib/mock/stories.ts`, avec leurs photos dans `public/stories/` (portrait, ~736 px de large) ; sans photo (`image`), une composition aux couleurs du défi et du participant est dessinée.
- **Données** : tout vient de `src/lib/mock/data.ts` (participant courant, billet, participants, publications, conversations, défis), structuré comme les futurs modèles Prisma. Le QR code est généré côté serveur en SVG (`src/components/ticket/QrCode.tsx`, bibliothèque `qrcode`).
- **Interactions locales** : j'aime, publication, recherche, envoi de message avec réponse simulée. Rien n'est encore enregistré en base ; l'authentification et les comptes viendront ensuite.
- **Profil** : carte d'identité (photo modifiable, nom, poste, date d'inscription) et liste de réglages ; chaque ligne ouvre une fenêtre de modification : boîte centrée avec fond assombri sur ordinateur, feuille qui monte du bas sur mobile (`src/components/profile/`) ; Échap ferme, le focus revient sur la ligne. Formulaires : nom, bio avec compteur, entreprise et poste, ville et pays, site web et LinkedIn, e-mail, mot de passe avec jauge de robustesse, utilisateurs bloqués. Les modifications sont conservées dans le navigateur (`useProfile.ts`) en attendant les comptes ; le mot de passe n'est jamais stocké.
- **Messagerie** : sélecteur d'émojis sans dépendance (insertion à la position du curseur), message vocal enregistré avec l'API `MediaRecorder` du navigateur (micro quand le champ est vide, minuteur, annulation, limite de 60 s) et bulle audio avec lecture et forme d'onde. Les fichiers audio restent en mémoire du navigateur tant que la messagerie n'est pas branchée sur un stockage.
- **Réseaux sociaux** (`src/components/social/`, données `src/lib/mock/social.ts`) : fil des publications des participants pour les défis, présentées comme des posts Facebook, de la plus récente à la plus ancienne : en-tête (avatar, nom, ancienneté, réseau d'origine, défi), texte, photo ou vignette vidéo, compteurs de réactions, commentaires et partages, puis actions « Réagir » et « Commenter » vers la publication d'origine et « Partager ». Un bouton « Filtres » à droite du titre ouvre un panneau (ancré sous le bouton sur ordinateur, feuille en bas sur mobile) pour choisir le réseau, le défi et le tri ; le bouton affiche le nombre de filtres actifs. Les publications sont des données de démonstration ; le relevé réel des réactions se fera côté serveur.
- **Défis** : trois défis définis dans `src/lib/mock/challenges.ts` (« J'y serai » avant le gala, Pitch MECC, « J'y étais » après le gala). Défis 1 et 3 : « Participer » ouvre une feuille où l'on colle seulement le lien de sa publication Facebook ou Instagram (obligatoire, vérifié) et où l'on coche une case de conditions. Défi 2 : dépôt d'une vidéo de pitch de 2 minutes maximum (durée vérifiée) avec le nom de l'entreprise. Le défi 3 reste verrouillé jusqu'au 18 décembre à 19 h. Les participations sont conservées dans le navigateur (`localStorage`) tant qu'il n'y a pas de serveur ; elles alimentent l'accueil et l'onglet Défis du profil. Une photo de couverture peut être ajoutée par défi via `coverImage` (fichier dans `public/`).
- **Découvrir les défis** (`src/app/decouvrir/`, composants `src/components/discover/`) : page plein écran bleu nuit avec halos rouge et vert, cartes en verre dépoli et grille de maquette, accessible par le bouton « Découvrir les défis » de la page Les défis. Héros avec les chiffres clés, trois cartes « Choisissez le défi » façon bento, superposées en éventail sur ordinateur (la première au premier plan, la carte survolée passe devant ; rouge vif, claire, sombre ; illustration flottante, phrase courte, gain, bouton rond animé, halo qui suit le curseur, apparition au défilement ; `src/components/discover/ChallengePicker.tsx`), dock flottant (Défi 1, Défi 2, Défi 3, Quitter). Placée hors du groupe `(app)`, elle n'hérite pas de la navigation. Les pages de détail des défis (`/decouvrir/[slug]`) vivent dans le même espace : couverture, gain en dégradé, chips d'information, étapes en frise numérotée, notes « bon à savoir », panneau « En bref » fixe sur ordinateur et bouton « Participer » collant au-dessus du dock sur mobile (le dock reprend Défi 1, Défi 2, Défi 3 et Quitter, le défi courant en dégradé). La feuille de participation s'y affiche en thème sombre grâce à la classe `theme-dark`.
- **Développement** : le badge des outils de développement Next.js est désactivé dans `next.config.ts`, car il recouvrait la barre de saisie sur mobile ; les erreurs restent affichées.
- **Charte graphique CanCham** (document « Nouvelle charte CanCham ») : blanc `#ffffff`, bleu foncé `#0f1d2c` (texte, compte à rebours), rouge vif `#ad0707` (actions), vert `#007140` (états, succès) et dégradé linéaire 90° `#ad0707 → #007140` (barre sous les titres de page, bouton Billet, anneau des stories, halos de l'écran du billet). Montserrat en gras pour les titres et les étiquettes (`font-display`, `font-mono`), Open Sans pour les textes (`src/app/layout.tsx`). Les jetons sont dans `src/app/globals.css` (classe `theme-light` ; un thème sombre `theme-dark` reste disponible). Logos des réseaux sociaux redessinés en SVG (`src/components/app/BrandLogos.tsx`). Correspondance des jetons : vert `--palm` pour les fonds d'action et `--palm-ink` pour le texte vert, rouge `--leaf` / `--leaf-ink`, or `--gold`, surfaces translucides `--surface` et opaques `--elevated`. Le billet garde un papier blanc grâce à l'îlot `theme-light`. Fraunces pour les titres, Geist pour l'interface. Animations CSS discrètes (entrée de page en cascade, halos de la bannière, téléphone du billet qui se pose, cœur qui bondit, bulles qui arrivent), `prefers-reduced-motion` respecté, zones tactiles d'au moins 44 px, cartes pleine largeur sur téléphone (classe `m-bleed` de `src/app/globals.css` : collées aux bords gauche et droit, sans arrondi ni bordure latérale, comme les publications Facebook), zones sûres des téléphones à encoche.

### Palette et typographie

Les couleurs sont déclarées dans `src/app/globals.css` et exposées à Tailwind (`bg-brand-red`, `text-amber`, …) :

| Jeton           | Valeur    | Usage                       |
| --------------- | --------- | --------------------------- |
| `--night`       | `#0b0908` | Fond nocturne               |
| `--brand-red`   | `#b5121f` | Action principale           |
| `--brand-green` | `#0b6a3e` | Accent secondaire, succès   |
| `--amber`       | `#ffc25c` | Lumière de la lampe, focus  |
| `--ink`         | `#f6f1e8` | Texte principal             |

Polices : Fraunces (titres), Geist (interface), Geist Mono (étiquettes).

## Structure

```
prisma/
  schema.prisma          # Modèles (table `events`)
  seed.ts                # Données d'exemple
  migrations/            # Migrations SQL générées
prisma.config.ts         # Config Prisma (lit DATABASE_URL depuis .env)
public/cancham-logo.png  # Symbole CanCham (fond transparent, navigation)
public/cancham-logo-full.png # Logo complet avec le nom de la chambre
src/app/icon.png, apple-icon.png # Icônes de l'application (onglet, écran d'accueil iOS)
src/
  lib/prisma.ts          # Client Prisma unique (adapter pg)
  lib/format.ts          # Dates et durées en français
  lib/mock/data.ts       # Données de démonstration de l'espace participant
  generated/prisma/      # Client généré (ignoré par git)
  components/
    app/                 # Coquille (AppShell), icônes, avatar, titres de page
    ticket/              # QR code (SVG serveur) et maquette de téléphone du billet
    feed/                # Fil de communauté et cartes de publication
    messages/            # Liste des conversations et fil de discussion
    profile/             # Onglets du profil
  app/
    (app)/               # Espace participant : accueil, billet, communauté, messages, profil…
    events/page.tsx      # Liste des événements (Server Component)
    api/health/route.ts  # GET  /api/health  → état de la base
    api/events/route.ts  # GET  /api/events  → liste
                         # POST /api/events  → création
```

## Exemple d'appel API

```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{"title":"Réunion","startsAt":"2026-12-01T09:00:00Z","location":"Salle A"}'
```

## Modifier le schéma

1. Éditez `prisma/schema.prisma`.
2. Lancez `npm run db:migrate` et donnez un nom à la migration.
3. Le client est régénéré automatiquement ; sinon `npm run db:generate`.

## Plateforme La Traversée (espace participant et back-office)

Depuis le 12 octobre 2026, l’application reproduit la maquette « Plateforme La Traversée » de bout en bout, avec la palette de la plateforme (bleu nuit et orange pour les actions, vert réservé aux états validés ; l’affiche « J’y serai » et le billet gardent le dégradé CanCham 10 ans) et des animations partout (entrées en cascade, pastille de menu en dégradé, tiroir mobile, halos, tourne de page, balayage de reconnaissance, compteurs en direct). Tout repose sur des données d’exemple et un store dans le navigateur (`src/lib/traversee/store.ts`, clé `traversee.v1`) : ce que fait le back-office se voit immédiatement côté participant dans le même navigateur.

**Coquille** (`src/components/app/AppShell.tsx`, `shell.module.css`) : barre latérale bleu nuit à sections (Événement, Réseau, Souvenirs), barre du haut avec fil d’Ariane, recherche globale (vers l’annuaire), cloche des annonces et mention « Données d’exemple », bouton d’aide vers la messagerie de l’équipe, barre d’onglets et tiroir sur téléphone. Le préfixe `/admin` bascule la coquille en back-office (sections Pilotage, Événement, Contenus).

| Route | Page |
|---|---|
| `/` | Accueil : stories en cartes avec visionneuse (stories créées par la CanCham puis toutes les photos en ligne de la galerie, dérivées par `src/lib/traversee/galerie.ts` ; une photo supprimée dans Photos et vidéos disparaît des stories), publication des participants, fil (publications CanCham, actualités), quatre emplacements promotion |
| `/programme`, `/programme/[id]` | Programme filtré par catégorie, inscription avec places restantes, fiche détaillée |
| `/defis/pitch` | Gagnez un voyage au Canada : gain, étapes, envoi du pitch, vote des demi-finalistes en direct, finale simulée |
| `/defis/tombola` | Gagnez 3 000 000 Ar : affiche « J’y serai » générée (photo, nom, QR), texte à copier, lien de publication avec aperçu, classement en direct |
| `/place` | Plan de salle de 24 tables à dix chaises, réservation d’une chaise, convives, recherche d’une entreprise |
| `/achats` | Appel à manifestation d’intérêt MECC 2027, carte et panier, commande (table, règlement), mes achats, billet nominatif |
| `/annuaire` | Fiches des participants, recherche et secteur, demande de rendez-vous B2B (heure, emplacement, réservation 48 h) |
| `/rdv` | Rendez-vous confirmés avec notes, demandes envoyées (simulation de réponse), demandes reçues à valider |
| `/ressources` | Dossiers et documents, recherche, type, tri, grille ou liste |
| `/photos` | Galerie, ajout de photos, « Me retrouver » (reconnaissance simulée), agrandissement et téléchargement |
| `/livre` | Livre d’or vidéo feuilleté page à page, recherche dans les sous-titres, dépôt d’une vidéo |
| `/profil` | Chiffres clés, prochaines étapes, fiche et formulaire, consentements, billet |
| `/admin` | Accueil du back-office, même présentation que l’accueil participant : composer « Publier au nom de la CanCham » (publication ou story dans la fenêtre), stories, fil avec suppression, promotions modifiables |
| `/admin/annonces` | Annonces en popup chez les participants, modèles, aperçu téléphone, historique (renvoyer, supprimer) |
| `/admin/scanner` | Scanner QR pour l’entrée du gala : caméra arrière (détection native `BarcodeDetector` quand le navigateur l’offre, sinon décodage logiciel avec `jsqr`), scanner plein écran dès l’activation de la caméra (barre de fermeture, compteur, résultat en bas pendant 5 s, Échap pour fermer), bannière masquée sur téléphone, viseur animé, verdict en grand (entrée validée, paiement en attente, déjà scanné, billet inconnu) avec nom, entreprise et table, saisie manuelle de l’identifiant, liste des participants déjà scannés (nom, rôle, entreprise, identifiant, heure, recherche, jauge entrés / inscrits ; clé `scans` du store) |
| `/admin/messagerie`, `/admin/programme`, `/admin/participants`, `/admin/places`, `/admin/commandes` | Messagerie identique à celle des participants (liste, fil, emojis, vocaux ; `/admin/messagerie/[id]`), programme modifiable, participants présentés comme l’annuaire (fiches, recherche, secteur, billet) avec fiche profil consultable et modifiable (coordonnées, secteur, activité, billet, QR code du billet agrandissable ; modifications dans `traversee.v1`), attribution des places, suivi paiement et service |
| `/admin/defis/pitch`, `/admin/defis/tombola` | Demi-finalistes (ajout, retrait, finale), classement et désignation du gagnant |
| `/admin/photos`, `/admin/livre`, `/admin/ressources` | Tri de la galerie, validation et sous-titres du livre d’or, dossiers et documents |

Les anciennes pages `/billet`, `/reseaux`, `/communaute` et l’espace `/decouvrir` restent accessibles (le billet est lié depuis Achats et Profil). Images de la maquette dans `public/traversee/`.

## Liaison avec Facebook et Instagram

Quand un participant colle le lien de sa publication (défis 1 et 3), l'application :

1. **Analyse le lien** (`src/lib/social/links.ts`) : accepte les liens de publication, photo, vidéo, reel, partage et `fb.watch` de Facebook, ainsi que `/p/`, `/reel/` et `/tv/` d'Instagram. Les profils, les pages et les autres sites sont refusés avec un message clair. Le lien est normalisé (suivi publicitaire retiré) avant d'être enregistré.
2. **Affiche un aperçu** de la vraie publication (`src/components/social/PostEmbed.tsx`) grâce aux extraits intégrables officiels de Facebook et d'Instagram. Aucune clé n'est nécessaire, mais la publication doit être publique. L'aperçu se retrouve ensuite dans le résumé de la participation.
3. **Vérifie la publication côté serveur** (`GET /api/publications/check?url=…`, `src/lib/social/meta.ts`) avec l'API oEmbed de Meta, uniquement si `META_APP_ID` et `META_APP_SECRET` sont renseignés dans `.env`. Une publication privée ou supprimée est alors refusée avant l'envoi. Sans ces clés, la route répond `verification: "disabled"` et la participation est acceptée sur la forme.

### Réactions réelles (défi 3 000 000 Ar)

Facebook refuse de lire ses propres adresses avec la clé d’application (« Facebook URLs cannot be crawled »). Le vrai nombre de réactions passe donc par **Facebook Login** : le participant connecte le compte qui a publié (`GET /api/facebook/login` → dialogue OAuth → `/api/facebook/callback`, jeton longue durée dans un cookie `httpOnly` de 60 jours, `/api/facebook/status` et `/api/facebook/logout`). La route `GET /api/publications/reactions?url=…` (`src/lib/social/facebook.ts`) lit alors `reactions.summary(total_count)`, les commentaires et les partages sur la publication : par son `fbid` pour une photo, sinon en la retrouvant dans `/me/posts` par son identifiant. Sur la page du défi, « Ma publication » affiche la valeur réelle avec l’heure du relevé et un bouton « Actualiser » ; le compteur simulé a été retiré pour cette ligne.

Limites de Meta : une publication dans un **groupe** n’est pas lisible (message explicite, publier sur son profil en Public) ; Instagram personnel non plus. Permissions demandées : `public_profile`, `user_posts`, `user_photos` (modifiables par `META_SCOPES`). Les clés `META_BUSINESS_APP_ID` / `META_BUSINESS_APP_SECRET`, si renseignées, priment sur `META_APP_ID` / `META_APP_SECRET`. Attention : une app Meta de type **Business** n’a pas accès à `user_posts` (erreur « Invalid Scopes » à la connexion) ; il faut une app de type **Consommateur** pour lire les publications d’un profil personnel. En mode développement de l’app Meta, elles fonctionnent pour les administrateurs et testeurs de l’app ; pour tous les participants, elles doivent passer l’App Review de Meta. Côté app Meta : ajouter le produit Facebook Login et déclarer l’URI de redirection (`http://localhost:3000/api/facebook/callback` en local, l’URL publique en production, ou `META_REDIRECT_URI`).

Variables d'environnement (jamais dans Git) : `META_APP_ID`, `META_APP_SECRET`, `META_GRAPH_VERSION` (défaut `v23.0`). Modèle dans `.env.example`.
