-- CreateTable
CREATE TABLE "parcours_accueil" (
    "user_id" INTEGER NOT NULL,
    "passees" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "commence_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "termine_le" TIMESTAMP(3),
    "maj_le" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parcours_accueil_pkey" PRIMARY KEY ("user_id")
);

-- AddForeignKey
ALTER TABLE "parcours_accueil" ADD CONSTRAINT "parcours_accueil_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

