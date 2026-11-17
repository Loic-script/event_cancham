#!/bin/sh
# Démarrage du conteneur (voir Dockerfile). Lancé en root, il donne le dossier
# de stockage à l'utilisateur node, met la base à jour (migrations en attente),
# puis démarre l'application sous node : le serveur Next.js « standalone »
# (server.js) ; Prisma est dans /app/migrate.
set -e

STOCKAGE="${STOCKAGE_DIR:-/app/stockage}"
MIGRER="cd /app/migrate && exec node_modules/.bin/prisma migrate deploy"

if [ "$(id -u)" = "0" ]; then
  mkdir -p "$STOCKAGE"
  find "$STOCKAGE" ! -user node -exec chown node:node {} +
  su-exec node sh -c "$MIGRER"
  exec su-exec node node /app/server.js
fi

sh -c "$MIGRER"
exec node /app/server.js
