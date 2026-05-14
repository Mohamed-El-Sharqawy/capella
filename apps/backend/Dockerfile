# Backend Dockerfile - Bun + Elysia + Prisma
# Build and run from dist for production
FROM oven/bun:1
WORKDIR /app

RUN bun add -g pnpm@10

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-utils/package.json ./packages/shared-utils/

RUN pnpm install --frozen-lockfile

COPY apps/backend ./apps/backend
COPY packages ./packages

WORKDIR /app/apps/backend
RUN pnpm exec prisma generate
RUN pnpm build

ENV NODE_ENV=production
ENV PORT=3001

ARG ZIINA_API_KEY
ARG ZIINA_WEBHOOK_SECRET
ARG MAILTRAP_TOKEN
ENV ZIINA_API_KEY=${ZIINA_API_KEY}
ENV ZIINA_WEBHOOK_SECRET=${ZIINA_WEBHOOK_SECRET}
ENV MAILTRAP_TOKEN=${MAILTRAP_TOKEN}

EXPOSE 3001

CMD ["sh", "-c", "pnpm exec prisma db push --accept-data-loss && bun run dist/index.js"]
