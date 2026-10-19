-- Programme de la journée en base (modifiable depuis /admin/programme) et inscriptions des participants.
-- CreateTable
CREATE TABLE "programme" (
    "id" TEXT NOT NULL,
    "titre" VARCHAR(160) NOT NULL,
    "categorie" VARCHAR(40) NOT NULL,
    "heure" VARCHAR(60) NOT NULL,
    "lieu" VARCHAR(160) NOT NULL,
    "places" INTEGER NOT NULL DEFAULT 0,
    "resume" VARCHAR(300) NOT NULL,
    "details" VARCHAR(4000) NOT NULL DEFAULT '',
    "image" VARCHAR(40) NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "programme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programme_inscriptions" (
    "rendez_vous_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "programme_inscriptions_pkey" PRIMARY KEY ("rendez_vous_id","user_id")
);

-- CreateIndex
CREATE INDEX "programme_inscriptions_user_id_idx" ON "programme_inscriptions"("user_id");

-- AddForeignKey
ALTER TABLE "programme_inscriptions" ADD CONSTRAINT "programme_inscriptions_rendez_vous_id_fkey" FOREIGN KEY ("rendez_vous_id") REFERENCES "programme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programme_inscriptions" ADD CONSTRAINT "programme_inscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rendez-vous de départ, repris de l'ancien programme du navigateur (sans les descriptions ni les inscrits d'exemple).
INSERT INTO "programme" ("id", "titre", "categorie", "heure", "lieu", "places", "resume", "image", "ordre") VALUES
    ('expo', 'Expositions des membres', 'Expositions', 'Toute la journée', 'CCI Ivato', 0, 'Les entreprises membres présentent leurs produits et services.', 'accueil', 0),
    ('p1', 'Panel · Culture d’affaires canadienne', 'Panels', 'En journée', 'CCI Ivato', 80, 'Horaire précis à confirmer.', 'pitch', 1),
    ('p2', 'Panel · Investissement', 'Panels', 'En journée', 'CCI Ivato', 80, 'Horaire précis à confirmer.', 'groupe', 2),
    ('p3', 'Panel · Commerce', 'Panels', 'En journée', 'CCI Ivato', 80, 'Horaire précis à confirmer.', 'ecran', 3),
    ('p4', 'Panel · Accès au financement', 'Panels', 'En journée', 'CCI Ivato', 80, 'Horaire précis à confirmer.', 'rdv', 4),
    ('p5', 'Panel · Entreprendre et immigrer au Canada', 'Panels', 'En journée', 'CCI Ivato', 80, 'Horaire précis à confirmer.', 'formation', 5),
    ('p6', 'Panel · Réseautage', 'Panels', 'En journée', 'CCI Ivato', 80, 'Horaire précis à confirmer.', 'public', 6),
    ('57', 'Réseautage 5 à 7', 'Réseautage', '17 h 00', 'CCI Ivato', 200, 'Deux heures d’échanges directs.', 'reseau', 7),
    ('gala', 'Soirée Gala des 10 ans', 'Gala', '19 h 00', 'CCI Ivato', 240, 'Dîner, finale des pitchs et remise des lots.', 'musique', 8);
