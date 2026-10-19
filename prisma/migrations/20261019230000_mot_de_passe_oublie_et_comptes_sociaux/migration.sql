-- Mot de passe oublié (liens à usage unique) et comptes Google / Facebook reliés aux utilisateurs.
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "facebook_id" TEXT,
ADD COLUMN     "google_id" TEXT;

-- CreateTable
CREATE TABLE "reinitialisations_mot_de_passe" (
    "id" SERIAL NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "utilise_le" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reinitialisations_mot_de_passe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reinitialisations_mot_de_passe_token_hash_key" ON "reinitialisations_mot_de_passe"("token_hash");

-- CreateIndex
CREATE INDEX "reinitialisations_mot_de_passe_user_id_idx" ON "reinitialisations_mot_de_passe"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_facebook_id_key" ON "users"("facebook_id");

-- AddForeignKey
ALTER TABLE "reinitialisations_mot_de_passe" ADD CONSTRAINT "reinitialisations_mot_de_passe_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

