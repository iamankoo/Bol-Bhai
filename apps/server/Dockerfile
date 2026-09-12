FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
WORKDIR /repo
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/server ./apps/server
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @bol-bhai/shared build
RUN pnpm --filter @bol-bhai/server build
RUN pnpm deploy --filter @bol-bhai/server --prod --legacy /prod/server

FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /prod/server/dist ./dist
COPY --from=build /prod/server/node_modules ./node_modules
COPY --from=build /prod/server/package.json ./package.json
EXPOSE 4000
CMD ["node", "dist/server.js"]
