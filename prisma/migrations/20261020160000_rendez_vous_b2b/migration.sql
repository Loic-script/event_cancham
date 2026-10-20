-- Rendez-vous B2B entre participants, en base (auparavant gardés dans le navigateur, avec des demandes d'exemple).
-- CreateTable
CREATE TABLE "rendez_vous_b2b" (
    "id" TEXT NOT NULL,
    "demandeur_id" INTEGER NOT NULL,
    "destinataire_id" INTEGER NOT NULL,
    "creneau" INTEGER NOT NULL,
    "lieu" INTEGER NOT NULL,
    "statut" VARCHAR(12) NOT NULL DEFAULT 'ATTENTE',
    "note_demandeur" VARCHAR(1000) NOT NULL DEFAULT '',
    "note_destinataire" VARCHAR(1000) NOT NULL DEFAULT '',
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decide_le" TIMESTAMP(3),

    CONSTRAINT "rendez_vous_b2b_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rendez_vous_b2b_creneau_lieu_statut_idx" ON "rendez_vous_b2b"("creneau", "lieu", "statut");

-- CreateIndex
CREATE INDEX "rendez_vous_b2b_demandeur_id_idx" ON "rendez_vous_b2b"("demandeur_id");

-- CreateIndex
CREATE INDEX "rendez_vous_b2b_destinataire_id_idx" ON "rendez_vous_b2b"("destinataire_id");

-- AddForeignKey
ALTER TABLE "rendez_vous_b2b" ADD CONSTRAINT "rendez_vous_b2b_demandeur_id_fkey" FOREIGN KEY ("demandeur_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rendez_vous_b2b" ADD CONSTRAINT "rendez_vous_b2b_destinataire_id_fkey" FOREIGN KEY ("destinataire_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

