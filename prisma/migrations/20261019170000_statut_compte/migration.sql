-- Statut d'accès des comptes à l'espace participant.
CREATE TYPE "StatutCompte" AS ENUM ('EN_ATTENTE', 'ACTIF', 'REFUSE');

-- Les comptes existants avaient déjà accès à l'espace : ils restent actifs.
ALTER TABLE "users" ADD COLUMN "statut" "StatutCompte" NOT NULL DEFAULT 'ACTIF',
ADD COLUMN "decision_le" TIMESTAMP(3);

-- Les nouveaux inscrits attendent la validation de l'équipe.
ALTER TABLE "users" ALTER COLUMN "statut" SET DEFAULT 'EN_ATTENTE';
