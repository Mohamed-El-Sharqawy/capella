# Backend Dockerfile - Bun + Elysia + Prisma
# Stage 1: Install dependencies with Node.js (pnpm under Bun lacks node:sqlite)
FROM node:20-alpine AS deps
WORKDIR /app
RUN npm install -g pnpm
RUN apk add --no-cache libc6-compat
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-utils/package.json ./packages/shared-utils/
RUN pnpm install --frozen-lockfile

# Stage 2: Build and run with Bun
FROM oven/bun:1.2
WORKDIR /app
RUN bun add -g pnpm

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=deps /app/packages/node_modules ./packages/node_modules
COPY --from=deps /app/packages/shared-types/node_modules ./packages/shared-types/node_modules
COPY --from=deps /app/packages/shared-utils/node_modules ./packages/shared-utils/node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend ./apps/backend
COPY packages ./packages

WORKDIR /app/apps/backend
RUN pnpm exec prisma generate
RUN pnpm build

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["sh", "-c", "pnpm exec prisma db push && bun run dist/index.js"]
