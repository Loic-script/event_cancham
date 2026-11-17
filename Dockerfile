# Même construction que le Dockerfile généré par TwinsDeploi, en sortie « standalone »
# (next.config.ts) : l'image ne garde que le serveur Next.js et les fichiers qu'il utilise.
# Le démarrage rend le dossier de stockage inscriptible : le volume monté sur /data
# appartient à root, alors que l'application tourne avec l'utilisateur node.
FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN npm ci
ENV NODE_ENV=production
RUN npm run build
RUN mkdir -p public

# Ce qui tourne hors du serveur Next.js, aux versions du package-lock :
# Prisma pour les migrations au démarrage, pdfjs-dist et @napi-rs/canvas pour
# scripts/pdf-en-pages.mjs (lancé à part, donc absent de la sortie standalone).
FROM node:22-alpine AS outils
WORKDIR /outils
COPY package-lock.json ./
RUN node -e "const l = require('./package-lock.json').packages; const v = (n) => l['node_modules/' + n].version; const fs = require('fs'); const paquet = (dossier, deps) => { fs.mkdirSync(dossier); fs.writeFileSync(dossier + '/package.json', JSON.stringify({ private: true, dependencies: deps })); }; paquet('migrate', { prisma: v('prisma'), dotenv: v('dotenv') }); paquet('scripts', { 'pdfjs-dist': v('pdfjs-dist'), '@napi-rs/canvas': v('@napi-rs/canvas') });" \
 && cd /outils/migrate && npm install --omit=dev --no-audit --no-fund \
 && cd /outils/scripts && npm install --omit=dev --no-audit --no-fund

FROM node:22-alpine
RUN apk add --no-cache su-exec
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --from=outils --chown=node:node /outils/migrate ./migrate
COPY --from=build --chown=node:node /app/prisma ./migrate/prisma
COPY --from=build --chown=node:node /app/prisma.config.ts ./migrate/prisma.config.ts
COPY --from=outils --chown=node:node /outils/scripts ./scripts
COPY --from=build --chown=node:node /app/scripts ./scripts
EXPOSE 3000
CMD ["sh", "/app/scripts/demarrer.sh"]
