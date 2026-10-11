# syntax=docker/dockerfile:1
FROM node:24.21.0-bookworm-slim AS tooling
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm install --global pnpm@12.6.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json

FROM tooling AS production-dependencies
RUN pnpm --filter @fork/web... install --prod --frozen-lockfile

FROM --platform=$BUILDPLATFORM node:24.21.0-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm install --global pnpm@12.6.0
COPY --from=tooling /app/ /app/
RUN pnpm install --frozen-lockfile
COPY tsconfig.base.json tsconfig.json ./
COPY apps/web apps/web
COPY packages/db packages/db
COPY packages/shared packages/shared
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_PRIVY_APP_ID
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_PRIVY_APP_ID=$NEXT_PUBLIC_PRIVY_APP_ID
RUN test -n "$NEXT_PUBLIC_PRIVY_APP_ID" && pnpm --filter @fork/web build
# Keep the normal Next runtime and compile its existing TS config without a
# runtime TypeScript dependency. Runtime secrets were never supplied to build.
RUN node --input-type=module -e 'import fs from "node:fs"; import { stripTypeScriptTypes } from "node:module"; fs.writeFileSync("apps/web/next.config.mjs", stripTypeScriptTypes(fs.readFileSync("apps/web/next.config.ts", "utf8"))); fs.mkdirSync("apps/web/public", { recursive: true });' \
    && rm -rf apps/web/.next/cache

FROM node:24.21.0-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 FORK_LISTEN_HOST=0.0.0.0
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=production-dependencies --chown=node:node /app/package.json ./package.json
COPY --from=production-dependencies --chown=node:node /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=production-dependencies --chown=node:node /app/apps/web/package.json ./apps/web/package.json
COPY --from=production-dependencies --chown=node:node /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=production-dependencies --chown=node:node /app/packages/db/package.json ./packages/db/package.json
COPY --from=production-dependencies --chown=node:node /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=production-dependencies --chown=node:node /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build --chown=node:node /app/apps/web/.next ./apps/web/.next
COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public
COPY --from=build --chown=node:node /app/apps/web/next.config.mjs ./apps/web/next.config.mjs
COPY --chown=node:node packages/db/src/index.ts packages/db/src/schema.ts packages/db/src/migrate.ts ./packages/db/src/
COPY --chown=node:node packages/db/migrations ./packages/db/migrations
COPY --chown=node:node packages/shared/src ./packages/shared/src
COPY --chown=node:node deploy/start.mjs deploy/health.mjs deploy/demo-transfer.mjs ./deploy/
USER node
WORKDIR /app/apps/web
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=15s --start-period=20s --retries=5 CMD ["node", "/app/deploy/health.mjs"]
CMD ["node", "/app/deploy/start.mjs"]
