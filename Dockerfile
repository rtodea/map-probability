FROM node:24-slim AS base

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

# Generate the SQLite database if not already present
RUN test -f data/births.db || node scripts/ingest.js

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "server.js"]
