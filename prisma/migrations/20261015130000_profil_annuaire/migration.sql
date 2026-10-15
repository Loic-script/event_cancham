-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bio" VARCHAR(600),
ADD COLUMN     "billet_paye" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "sector" TEXT,
ADD COLUMN     "website" TEXT;
