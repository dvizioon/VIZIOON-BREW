FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates tar gzip \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY scripts/with-database-url.mjs ./scripts/with-database-url.mjs
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vizioon-brew
RUN npm ci --include=dev
COPY . .
RUN npm run runtime:java && npm run runtime:python
RUN npx prisma generate && NODE_ENV=production npm run build

FROM node:22-bookworm-slim

ARG APP_PORT=3630
ARG APP_ENV=production
ENV PORT=${APP_PORT}
ENV APP_ENV=${APP_ENV}
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

RUN apt-get update \
  && apt-get install -y --no-install-recommends bubblewrap util-linux coreutils python3 postgresql-client ca-certificates \
  && npm install -g prisma@6.16.2 \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src/modules/runtimes ./src/modules/runtimes
COPY docker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
EXPOSE ${APP_PORT}
ENTRYPOINT ["docker-entrypoint.sh"]
