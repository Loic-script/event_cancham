# Même construction que le Dockerfile généré par TwinsDeploi, avec un démarrage
# qui rend le dossier de stockage inscriptible : le volume monté sur /data
# appartient à root, alors que l'application tourne avec l'utilisateur node.
FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN npm ci
ENV NODE_ENV=production
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-alpine
RUN apk add --no-cache su-exec
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=node:node /app ./
EXPOSE 3000
CMD ["sh", "/app/scripts/demarrer.sh"]
