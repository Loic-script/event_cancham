-- AlterTable
ALTER TABLE "users" ADD COLUMN     "paiement_reference" VARCHAR(20),
ADD COLUMN     "paye_le" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "paiements" (
    "id" TEXT NOT NULL,
    "reference" VARCHAR(20) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "montant" INTEGER NOT NULL,
    "devise" VARCHAR(3) NOT NULL DEFAULT 'MGA',
    "mode" VARCHAR(20) NOT NULL,
    "statut" VARCHAR(10) NOT NULL DEFAULT 'en_cours',
    "transaction" VARCHAR(120),
    "notification" JSONB,
    "regle_le" TIMESTAMP(3),
    "cree_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "maj_le" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paiements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "paiements_reference_key" ON "paiements"("reference");

-- CreateIndex
CREATE INDEX "paiements_user_id_statut_idx" ON "paiements"("user_id", "statut");

-- CreateIndex
CREATE INDEX "paiements_transaction_idx" ON "paiements"("transaction");

-- AddForeignKey
ALTER TABLE "paiements" ADD CONSTRAINT "paiements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

