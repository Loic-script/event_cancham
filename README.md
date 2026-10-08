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
| `/billet`        | Billet d'entrée avec QR code, mode plein écran pour le scan, partage et téléchargement   |
| `/communaute`    | Fil de communauté : publications, défis relevés, annuaire des participants avec recherche |
| `/messages`      | Messagerie façon Messenger : liste, puis `/messages/[id]` avec émojis et messages vocaux |
| `/profil`        | Profil et réglages : identité, lignes modifiables (nom, bio, entreprise, ville, liens, e-mail, mot de passe, bloqués), mes défis, mes publications |
| `/defis`         | Les trois défis du gala, puis `/defis/[slug]` : règles, étapes et participation          |
| `/reseaux`       | Réseaux sociaux (page d'attente)                                                         |
| `/events`        | Liste technique des événements lus en base (hors espace participant)                     |

- **Navigation** : barre d'onglets en bas sur mobile (Accueil, Fil, Billet au centre, Messages, Profil) et menu « Plus » pour Les défis et Réseaux sociaux ; sur ordinateur, barre latérale avec les sept rubriques, en-tête avec recherche globale (raccourci `/`, envoie vers l'annuaire des participants filtré) et, à partir de 1280 px, colonne de droite avec la carte du billet (chiffres clés et QR code, qui mène au billet en grand), les nouveaux participants et les réseaux de CanCham. Coquille dans `src/components/app/AppShell.tsx`, colonne de droite dans `RightPanel.tsx`.
- **Accueil** : bannière héros claire (blanc teinté de rouge et de vert, texte bleu nuit) avec compte à rebours en direct (tuiles jours, heures, minutes, secondes ; `src/components/app/Countdown.tsx`, valeur initiale calculée par le serveur pour éviter tout décalage d'hydratation), « Stories des défis » (bandeau façon réseau social : les photos de défi des participants, avatar cerclé, flèches sur ordinateur, visionneur plein écran avec barres de progression, défilement automatique, zones tactiles, flèches du clavier et réactions), « Populaire en ce moment » (raccourcis à visuels contextuels), « Derniers échos » ; sur écran étroit, les blocs de la colonne de droite s'affichent en bas de page. Les stories de démonstration sont dans `src/lib/mock/stories.ts`, avec leurs photos dans `public/stories/` (portrait, ~736 px de large) ; sans photo (`image`), une composition aux couleurs du défi et du participant est dessinée.
- **Données** : tout vient de `src/lib/mock/data.ts` (participant courant, billet, participants, publications, conversations, défis), structuré comme les futurs modèles Prisma. Le QR code est généré côté serveur en SVG (`src/components/ticket/QrCode.tsx`, bibliothèque `qrcode`).
- **Interactions locales** : j'aime, publication, recherche, envoi de message avec réponse simulée. Rien n'est encore enregistré en base ; l'authentification et les comptes viendront ensuite.
- **Profil** : carte d'identité (photo modifiable, nom, poste, date d'inscription) et liste de réglages ; la ligne active ouvre un panneau de modification à droite sur ordinateur, une feuille sur mobile (`src/components/profile/`). Formulaires : nom, bio avec compteur, entreprise et poste, ville et pays, site web et LinkedIn, e-mail, mot de passe avec jauge de robustesse, utilisateurs bloqués. Les modifications sont conservées dans le navigateur (`useProfile.ts`) en attendant les comptes ; le mot de passe n'est jamais stocké.
- **Messagerie** : sélecteur d'émojis sans dépendance (insertion à la position du curseur), message vocal enregistré avec l'API `MediaRecorder` du navigateur (micro quand le champ est vide, minuteur, annulation, limite de 60 s) et bulle audio avec lecture et forme d'onde. Les fichiers audio restent en mémoire du navigateur tant que la messagerie n'est pas branchée sur un stockage.
- **Défis** : trois défis définis dans `src/lib/mock/challenges.ts` (« J'y serai » avant le gala, Pitch MECC, « J'y étais » après le gala). Défis 1 et 3 : « Participer » ouvre une feuille où l'on ajoute sa photo (réduite à 1000 px côté navigateur), le lien de sa publication Facebook ou Instagram et une case de conditions. Défi 2 : dépôt d'une vidéo de pitch de 2 minutes maximum (durée vérifiée) avec le nom de l'entreprise. Le défi 3 reste verrouillé jusqu'au 18 décembre à 19 h. Les participations sont conservées dans le navigateur (`localStorage`) tant qu'il n'y a pas de serveur ; elles alimentent l'accueil et l'onglet Défis du profil. Une photo de couverture peut être ajoutée par défi via `coverImage` (fichier dans `public/`).
- **Développement** : le badge des outils de développement Next.js est désactivé dans `next.config.ts`, car il recouvrait la barre de saisie sur mobile ; les erreurs restent affichées.
- **Design** : fond blanc et surfaces de verre claires (classe `theme-light` dans `src/app/globals.css` ; un thème sombre `theme-dark` reste disponible), texte bleu nuit `#0f1d2c`, barres de défilement dégradées rouge → vert, logos des réseaux sociaux redessinés en SVG (`src/components/app/BrandLogos.tsx`), aux couleurs du logo CanCham : vert `--palm` pour les fonds d'action et `--palm-ink` pour le texte vert, rouge `--leaf` / `--leaf-ink`, or `--gold`, surfaces translucides `--surface` et opaques `--elevated`. Le billet garde un papier blanc grâce à l'îlot `theme-light`. Fraunces pour les titres, Geist pour l'interface. Animations CSS discrètes (entrée de page en cascade, halos de la bannière, billet qui se dépose, cœur qui bondit, bulles qui arrivent), `prefers-reduced-motion` respecté, zones tactiles d'au moins 44 px, zones sûres des téléphones à encoche.

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
    ticket/              # QR code (SVG serveur) et partie interactive du billet
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
