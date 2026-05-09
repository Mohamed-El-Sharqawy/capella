# Backend Dockerfile - Bun + Elysia + Prisma
FROM oven/bun:1
WORKDIR /app

COPY package.json bun.lock pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-utils/package.json ./packages/shared-utils/

RUN bun install --frozen-lockfile

COPY apps/backend ./apps/backend
COPY packages ./packages

WORKDIR /app/apps/backend
RUN bunx prisma generate
RUN bun run build

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["sh", "-c", "bunx prisma db push && bun run dist/index.js"]
