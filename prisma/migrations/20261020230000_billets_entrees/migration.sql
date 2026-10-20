-- AlterTable
ALTER TABLE "users" ADD COLUMN     "code_billet" VARCHAR(20) NOT NULL DEFAULT ('TRV26-'::text || upper(substr(md5(((random())::text || (clock_timestamp())::text)), 1, 8)));

-- CreateTable
CREATE TABLE "entrees_gala" (
    "user_id" INTEGER NOT NULL,
    "scanne_le" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scanne_par_id" INTEGER,

    CONSTRAINT "entrees_gala_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE INDEX "entrees_gala_scanne_le_idx" ON "entrees_gala"("scanne_le");

-- CreateIndex
CREATE UNIQUE INDEX "users_code_billet_key" ON "users"("code_billet");

-- AddForeignKey
ALTER TABLE "entrees_gala" ADD CONSTRAINT "entrees_gala_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entrees_gala" ADD CONSTRAINT "entrees_gala_scanne_par_id_fkey" FOREIGN KEY ("scanne_par_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

