-- CreateTable
CREATE TABLE "livre_or" (
    "id" TEXT NOT NULL,
    "auteur_id" INTEGER NOT NULL,
    "video" VARCHAR(300) NOT NULL,
    "duree" INTEGER,
    "texte" VARCHAR(1000) NOT NULL DEFAULT '',
    "statut" VARCHAR(10) NOT NULL DEFAULT 'ATTENTE',
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decide_le" TIMESTAMP(3),

    CONSTRAINT "livre_or_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "livre_or_statut_cree_le_idx" ON "livre_or"("statut", "cree_le");

-- CreateIndex
CREATE INDEX "livre_or_auteur_id_idx" ON "livre_or"("auteur_id");

-- AddForeignKey
ALTER TABLE "livre_or" ADD CONSTRAINT "livre_or_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

