#!/bin/sh
# Démarrage du conteneur (voir Dockerfile). Lancé en root, il donne le dossier
# de stockage à l'utilisateur node, puis démarre l'application sous node.
set -e

STOCKAGE="${STOCKAGE_DIR:-/app/stockage}"

if [ "$(id -u)" = "0" ]; then
  mkdir -p "$STOCKAGE"
  find "$STOCKAGE" ! -user node -exec chown node:node {} +
  exec su-exec node npm run start
fi

exec npm run start
