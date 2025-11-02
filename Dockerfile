# syntax=docker/dockerfile:1.7

FROM node:20-bookworm-slim AS base

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

FROM base AS deps

COPY package.json package-lock.json ./
RUN npm ci --include=dev

FROM deps AS build

COPY . .
RUN npm run build

FROM base AS runner

ENV NODE_ENV=production
EXPOSE 3000

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/next.config.ts ./next.config.ts
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next ./.next

USER node

CMD ["npm", "run", "start"]
