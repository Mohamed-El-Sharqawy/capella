# CMS Dockerfile - Vite + React
FROM node:20-alpine AS base
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/cms/package.json ./apps/cms/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-utils/package.json ./packages/shared-utils/

RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/cms/node_modules ./apps/cms/node_modules
COPY --from=deps /app/packages ./packages

# Copy source files
COPY apps/cms ./apps/cms
COPY packages ./packages
COPY pnpm-workspace.yaml ./

ENV NODE_ENV=production

# Build Vite app
WORKDIR /app/apps/cms
RUN pnpm build

# Production stage - serve with nginx
FROM nginx:alpine AS runner

# Copy built files to nginx
COPY --from=builder /app/apps/cms/dist /usr/share/nginx/html

# Copy nginx config for SPA routing
COPY apps/cms/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
