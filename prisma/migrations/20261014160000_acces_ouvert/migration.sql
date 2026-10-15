DELETE FROM "lectures_ressources";

-- DropForeignKey
ALTER TABLE "acces_dossiers" DROP CONSTRAINT "acces_dossiers_dossier_id_fkey";

-- DropForeignKey
ALTER TABLE "acces_dossiers" DROP CONSTRAINT "acces_dossiers_membre_id_fkey";

-- DropForeignKey
ALTER TABLE "acces_ressources" DROP CONSTRAINT "acces_ressources_membre_id_fkey";

-- DropForeignKey
ALTER TABLE "acces_ressources" DROP CONSTRAINT "acces_ressources_ressource_id_fkey";

-- DropForeignKey
ALTER TABLE "factures" DROP CONSTRAINT "factures_membre_id_fkey";

-- DropForeignKey
ALTER TABLE "factures" DROP CONSTRAINT "factures_tentative_id_fkey";

-- DropForeignKey
ALTER TABLE "factures" DROP CONSTRAINT "factures_utilisateur_id_fkey";

-- DropForeignKey
ALTER TABLE "lectures_ressources" DROP CONSTRAINT "lectures_ressources_utilisateur_id_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_utilisateur_id_fkey";

-- DropForeignKey
ALTER TABLE "tentatives_paiement" DROP CONSTRAINT "tentatives_paiement_membre_id_fkey";

-- DropForeignKey
ALTER TABLE "tentatives_paiement" DROP CONSTRAINT "tentatives_paiement_utilisateur_id_fkey";

-- DropForeignKey
ALTER TABLE "utilisateurs" DROP CONSTRAINT "utilisateurs_membre_id_fkey";

-- DropIndex
DROP INDEX "lectures_ressources_utilisateur_id_ressource_id_key";

-- AlterTable
ALTER TABLE "dossiers" DROP COLUMN "restreint";

-- AlterTable
ALTER TABLE "lectures_ressources" DROP COLUMN "utilisateur_id",
ADD COLUMN     "lecteur" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ressources" DROP COLUMN "prix",
DROP COLUMN "type";

-- DropTable
DROP TABLE "acces_dossiers";

-- DropTable
DROP TABLE "acces_ressources";

-- DropTable
DROP TABLE "factures";

-- DropTable
DROP TABLE "membres";

-- DropTable
DROP TABLE "notifications";

-- DropTable
DROP TABLE "tentatives_paiement";

-- DropTable
DROP TABLE "utilisateurs";

-- DropEnum
DROP TYPE "Role";

-- DropEnum
DROP TYPE "StatutPaiement";

-- DropEnum
DROP TYPE "TypeRessource";

-- CreateIndex
CREATE UNIQUE INDEX "lectures_ressources_lecteur_ressource_id_key" ON "lectures_ressources"("lecteur", "ressource_id");

