-- Super admin promu depuis la plateforme (en plus des adresses fixées par SUPER_ADMINS).
ALTER TABLE "users" ADD COLUMN "super_admin" BOOLEAN NOT NULL DEFAULT false;
