-- Fil d'actualité en base : publications, j'aime et commentaires (sur une publication ou un article officiel).
-- CreateTable
CREATE TABLE "publications" (
    "id" TEXT NOT NULL,
    "auteur_id" INTEGER NOT NULL,
    "equipe" BOOLEAN NOT NULL DEFAULT false,
    "texte" VARCHAR(1200) NOT NULL DEFAULT '',
    "image" TEXT,
    "video" TEXT,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fil_jaimes" (
    "cible" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fil_jaimes_pkey" PRIMARY KEY ("cible","user_id")
);

-- CreateTable
CREATE TABLE "fil_commentaires" (
    "id" TEXT NOT NULL,
    "cible" TEXT NOT NULL,
    "auteur_id" INTEGER NOT NULL,
    "texte" VARCHAR(1000) NOT NULL,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fil_commentaires_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "publications_cree_le_idx" ON "publications"("cree_le");

-- CreateIndex
CREATE INDEX "fil_commentaires_cible_cree_le_idx" ON "fil_commentaires"("cible", "cree_le");

-- AddForeignKey
ALTER TABLE "publications" ADD CONSTRAINT "publications_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fil_jaimes" ADD CONSTRAINT "fil_jaimes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fil_commentaires" ADD CONSTRAINT "fil_commentaires_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

