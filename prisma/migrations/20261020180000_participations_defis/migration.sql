-- Participations aux défis (vidéo pitch et note du jury, publication « J'y serai » et relevé des réactions), en base.
-- CreateTable
CREATE TABLE "participations_defis" (
    "id" TEXT NOT NULL,
    "defi" VARCHAR(12) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "lien" VARCHAR(500) NOT NULL,
    "reactions" INTEGER,
    "commentaires" INTEGER,
    "partages" INTEGER,
    "releve_le" TIMESTAMP(3),
    "note" DOUBLE PRECISION,
    "avis" VARCHAR(1000) NOT NULL DEFAULT '',
    "note_le" TIMESTAMP(3),
    "retire" BOOLEAN NOT NULL DEFAULT false,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "maj_le" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participations_defis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "participations_defis_defi_idx" ON "participations_defis"("defi");

-- CreateIndex
CREATE UNIQUE INDEX "participations_defis_defi_user_id_key" ON "participations_defis"("defi", "user_id");

-- AddForeignKey
ALTER TABLE "participations_defis" ADD CONSTRAINT "participations_defis_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

