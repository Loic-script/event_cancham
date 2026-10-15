-- CreateEnum
CREATE TYPE "Role" AS ENUM ('equipe', 'contact');

-- CreateEnum
CREATE TYPE "CategorieRessource" AS ENUM ('guide', 'modele', 'formation', 'rapport');

-- CreateEnum
CREATE TYPE "FormatRessource" AS ENUM ('pdf', 'docx', 'video', 'photo', 'page');

-- CreateEnum
CREATE TYPE "TypeRessource" AS ENUM ('gratuit', 'payant');

-- CreateEnum
CREATE TYPE "StatutPaiement" AS ENUM ('en_attente', 'reussie', 'echouee');

-- CreateTable
CREATE TABLE "membres" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "secteur" TEXT,
    "cotisation_jusqu_au" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'contact',
    "mot_de_passe" TEXT NOT NULL,
    "membre_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dossiers" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "couverture" TEXT,
    "auteur_nom" TEXT,
    "auteur_role" TEXT,
    "auteur_bio" TEXT,
    "auteur_photo" TEXT,
    "restreint" BOOLEAN NOT NULL DEFAULT false,
    "parent_id" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dossiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ressources" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "categorie" "CategorieRessource" NOT NULL DEFAULT 'guide',
    "format" "FormatRessource" NOT NULL,
    "taille" TEXT,
    "taille_octets" BIGINT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fichier" TEXT,
    "pages" INTEGER NOT NULL DEFAULT 0,
    "couverture" TEXT,
    "couverture_perso" BOOLEAN NOT NULL DEFAULT false,
    "description" VARCHAR(600),
    "contenu" JSONB,
    "type" "TypeRessource" NOT NULL DEFAULT 'gratuit',
    "prix" INTEGER NOT NULL DEFAULT 0,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "dossier_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ressources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acces_ressources" (
    "id" TEXT NOT NULL,
    "ressource_id" TEXT NOT NULL,
    "membre_id" TEXT NOT NULL,
    "ouvert_par" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acces_ressources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acces_dossiers" (
    "id" TEXT NOT NULL,
    "dossier_id" TEXT NOT NULL,
    "membre_id" TEXT NOT NULL,
    "ouvert_par" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acces_dossiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lectures_ressources" (
    "id" TEXT NOT NULL,
    "utilisateur_id" TEXT NOT NULL,
    "ressource_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lectures_ressources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tentatives_paiement" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "objet_type" TEXT NOT NULL,
    "objet_id" TEXT NOT NULL,
    "objet_titre" TEXT NOT NULL,
    "utilisateur_id" TEXT NOT NULL,
    "membre_id" TEXT NOT NULL,
    "montant" INTEGER NOT NULL,
    "moyen" TEXT NOT NULL,
    "statut" "StatutPaiement" NOT NULL DEFAULT 'en_attente',
    "etat_prestataire" TEXT,
    "confirmee_le" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tentatives_paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factures" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "montant" INTEGER NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'reglee',
    "membre_id" TEXT NOT NULL,
    "utilisateur_id" TEXT NOT NULL,
    "tentative_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "factures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "utilisateur_id" TEXT,
    "pour_equipe" BOOLEAN NOT NULL DEFAULT false,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "lien" TEXT,
    "lue" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal" (
    "id" TEXT NOT NULL,
    "acteur" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE INDEX "utilisateurs_membre_id_idx" ON "utilisateurs"("membre_id");

-- CreateIndex
CREATE INDEX "dossiers_parent_id_idx" ON "dossiers"("parent_id");

-- CreateIndex
CREATE INDEX "ressources_dossier_id_ordre_idx" ON "ressources"("dossier_id", "ordre");

-- CreateIndex
CREATE UNIQUE INDEX "acces_ressources_ressource_id_membre_id_key" ON "acces_ressources"("ressource_id", "membre_id");

-- CreateIndex
CREATE UNIQUE INDEX "acces_dossiers_dossier_id_membre_id_key" ON "acces_dossiers"("dossier_id", "membre_id");

-- CreateIndex
CREATE UNIQUE INDEX "lectures_ressources_utilisateur_id_ressource_id_key" ON "lectures_ressources"("utilisateur_id", "ressource_id");

-- CreateIndex
CREATE UNIQUE INDEX "tentatives_paiement_reference_key" ON "tentatives_paiement"("reference");

-- CreateIndex
CREATE INDEX "tentatives_paiement_objet_type_objet_id_idx" ON "tentatives_paiement"("objet_type", "objet_id");

-- CreateIndex
CREATE UNIQUE INDEX "factures_numero_key" ON "factures"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "factures_tentative_id_key" ON "factures"("tentative_id");

-- AddForeignKey
ALTER TABLE "utilisateurs" ADD CONSTRAINT "utilisateurs_membre_id_fkey" FOREIGN KEY ("membre_id") REFERENCES "membres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "dossiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ressources" ADD CONSTRAINT "ressources_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "dossiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acces_ressources" ADD CONSTRAINT "acces_ressources_ressource_id_fkey" FOREIGN KEY ("ressource_id") REFERENCES "ressources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acces_ressources" ADD CONSTRAINT "acces_ressources_membre_id_fkey" FOREIGN KEY ("membre_id") REFERENCES "membres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acces_dossiers" ADD CONSTRAINT "acces_dossiers_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "dossiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acces_dossiers" ADD CONSTRAINT "acces_dossiers_membre_id_fkey" FOREIGN KEY ("membre_id") REFERENCES "membres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lectures_ressources" ADD CONSTRAINT "lectures_ressources_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lectures_ressources" ADD CONSTRAINT "lectures_ressources_ressource_id_fkey" FOREIGN KEY ("ressource_id") REFERENCES "ressources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tentatives_paiement" ADD CONSTRAINT "tentatives_paiement_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tentatives_paiement" ADD CONSTRAINT "tentatives_paiement_membre_id_fkey" FOREIGN KEY ("membre_id") REFERENCES "membres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factures" ADD CONSTRAINT "factures_membre_id_fkey" FOREIGN KEY ("membre_id") REFERENCES "membres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factures" ADD CONSTRAINT "factures_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factures" ADD CONSTRAINT "factures_tentative_id_fkey" FOREIGN KEY ("tentative_id") REFERENCES "tentatives_paiement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
