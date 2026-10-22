-- CreateTable
CREATE TABLE "tentatives_connexion" (
    "id" SERIAL NOT NULL,
    "cle" VARCHAR(200) NOT NULL,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tentatives_connexion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tentatives_connexion_cle_cree_le_idx" ON "tentatives_connexion"("cle", "cree_le");

