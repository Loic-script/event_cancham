-- Annonces de l'équipe aux participants, en base (auparavant gardées dans le navigateur de l'admin), et annonces vues par chacun.
-- CreateTable
CREATE TABLE "annonces" (
    "id" TEXT NOT NULL,
    "titre" VARCHAR(120) NOT NULL,
    "message" VARCHAR(1200) NOT NULL,
    "type" VARCHAR(20) NOT NULL DEFAULT 'info',
    "cta" VARCHAR(200) NOT NULL DEFAULT '',
    "image" VARCHAR(200),
    "auteur_id" INTEGER,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "annonces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annonces_vues" (
    "annonce_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "vue_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "annonces_vues_pkey" PRIMARY KEY ("annonce_id","user_id")
);

-- CreateIndex
CREATE INDEX "annonces_cree_le_idx" ON "annonces"("cree_le");

-- CreateIndex
CREATE INDEX "annonces_vues_user_id_idx" ON "annonces_vues"("user_id");

-- AddForeignKey
ALTER TABLE "annonces" ADD CONSTRAINT "annonces_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annonces_vues" ADD CONSTRAINT "annonces_vues_annonce_id_fkey" FOREIGN KEY ("annonce_id") REFERENCES "annonces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annonces_vues" ADD CONSTRAINT "annonces_vues_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

