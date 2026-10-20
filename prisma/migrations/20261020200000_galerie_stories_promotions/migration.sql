-- CreateTable
CREATE TABLE "photos_galerie" (
    "id" VARCHAR(32) NOT NULL,
    "auteur_id" INTEGER,
    "officielle" BOOLEAN NOT NULL DEFAULT true,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photos_galerie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stories" (
    "id" TEXT NOT NULL,
    "image" VARCHAR(300) NOT NULL,
    "texte" VARCHAR(300) NOT NULL DEFAULT '',
    "auteur_id" INTEGER,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "emplacement" INTEGER NOT NULL,
    "annonceur" VARCHAR(80) NOT NULL,
    "titre" VARCHAR(60) NOT NULL,
    "texte" VARCHAR(90) NOT NULL DEFAULT '',
    "image" VARCHAR(300) NOT NULL,
    "lien" VARCHAR(200) NOT NULL,
    "maj_le" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("emplacement")
);

-- CreateIndex
CREATE INDEX "photos_galerie_cree_le_idx" ON "photos_galerie"("cree_le");

-- CreateIndex
CREATE INDEX "stories_cree_le_idx" ON "stories"("cree_le");

-- AddForeignKey
ALTER TABLE "photos_galerie" ADD CONSTRAINT "photos_galerie_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stories" ADD CONSTRAINT "stories_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Stories de départ de la CanCham (supprimables depuis le back-office). Dates en UTC, comme celles qu'écrit Prisma.
INSERT INTO "stories" ("id", "image", "texte", "cree_le") VALUES
  ('story_depart_gala', '/traversee/musique.jpg', 'Rendez-vous le 18 décembre pour le Gala des 10 ans.', (now() AT TIME ZONE 'UTC')),
  ('story_depart_pitch', '/traversee/pitch.jpg', 'Gagnez un voyage au Canada : envoyez votre pitch avant le 11 décembre.', (now() AT TIME ZONE 'UTC') - INTERVAL '1 minute'),
  ('story_depart_b2b', '/traversee/reseau.jpg', 'Réservez vos rendez-vous B2B depuis l’annuaire.', (now() AT TIME ZONE 'UTC') - INTERVAL '2 minutes');
