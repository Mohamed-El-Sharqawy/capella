# Backend Dockerfile - Bun + Elysia + Prisma
# Build and run from dist for production
FROM oven/bun:1
WORKDIR /app

# Install pnpm
RUN bun add -g pnpm

# Copy workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-utils/package.json ./packages/shared-utils/

# Install ALL dependencies including devDeps (needed for prisma CLI and build)
RUN pnpm install --frozen-lockfile

# Copy source files
COPY apps/backend ./apps/backend
COPY packages ./packages

# Generate Prisma client and build
WORKDIR /app/apps/backend
RUN pnpm exec prisma generate
RUN pnpm build

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Push schema then start from built dist
# DATABASE_URL is injected by docker-compose/Coolify at runtime
CMD ["sh", "-c", "pnpm exec prisma db push && bun run dist/index.js"]
