-- CreateEnum
CREATE TYPE "Acces" AS ENUM ('MEMBRE', 'ADMIN');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "acces" "Acces" NOT NULL DEFAULT 'MEMBRE';
