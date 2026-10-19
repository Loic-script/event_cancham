#!/bin/sh
# Démarrage du conteneur (voir Dockerfile). Lancé en root, il donne le dossier
# de stockage à l'utilisateur node, met la base à jour (migrations en attente),
# puis démarre l'application sous node.
set -e

STOCKAGE="${STOCKAGE_DIR:-/app/stockage}"
PRISMA=./node_modules/.bin/prisma

if [ "$(id -u)" = "0" ]; then
  mkdir -p "$STOCKAGE"
  find "$STOCKAGE" ! -user node -exec chown node:node {} +
  su-exec node "$PRISMA" migrate deploy
  exec su-exec node npm run start
fi

"$PRISMA" migrate deploy
exec npm run start
