# E-Commerce Platform

A monorepo e-commerce platform for men and women, featuring a backend API, marketing website, and CMS dashboard.

## Architecture

```
ecommerce-platform/
├── apps/
│   ├── backend/          # Elysia.js API (Bun runtime, Prisma 7, Neon DB)
│   ├── marketing/        # Next.js marketing site (Shadcn/ui, Tailwind CSS)
│   └── cms/              # React CMS dashboard (Vite, Shadcn/ui, Tailwind CSS)
├── packages/
│   ├── shared-types/     # TypeScript interfaces & enums shared across apps
│   └── shared-utils/     # Utility functions, constants, validation helpers
├── pnpm-workspace.yaml
└── package.json
```

## Tech Stack

| Workspace | Framework | Runtime | Styling | Port |
|-----------|-----------|---------|---------|------|
| **Backend** | Elysia.js | Bun | — | 3001 |
| **Marketing** | Next.js 15 | Node.js | Tailwind CSS v4 + Shadcn/ui | 3000 |
| **CMS** | React + Vite | Node.js | Tailwind CSS v4 + Shadcn/ui | 5173 |

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [Bun](https://bun.sh/) (for the backend)
- [pnpm](https://pnpm.io/) >= 9

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Copy the example env files and fill in your values:

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env

# Marketing
cp apps/marketing/.env.local.example apps/marketing/.env.local

# CMS
cp apps/cms/.env.example apps/cms/.env
```

**Required:** Set `DATABASE_URL` in `apps/backend/.env` to your Neon PostgreSQL connection string.

### 3. Set up the database

```bash
pnpm db:generate    # Generate Prisma client
pnpm db:migrate     # Run migrations (creates tables)
```

### 4. Run workspaces

```bash
# Run all workspaces in parallel
pnpm dev

# Or run individually
pnpm dev:backend     # http://localhost:3001
pnpm dev:marketing   # http://localhost:3000
pnpm dev:cms         # http://localhost:5173
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all workspaces in parallel |
| `pnpm dev:backend` | Start backend API |
| `pnpm dev:marketing` | Start marketing site |
| `pnpm dev:cms` | Start CMS dashboard |
| `pnpm build` | Build all workspaces |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:studio` | Open Prisma Studio |

## Shared Packages

### `@ecommerce/shared-types`
TypeScript interfaces and enums used across all workspaces: `User`, `Product`, `Order`, `Category`, pagination types, API response types.

### `@ecommerce/shared-utils`
Shared utility functions: `formatCurrency`, `formatDate`, `slugify`, `isValidEmail`, `isValidPassword`, pagination constants, API route constants.

Import in any workspace:
```ts
import { formatCurrency, PAGINATION_DEFAULTS } from "@ecommerce/shared-utils";
import type { Product, ApiResponse } from "@ecommerce/shared-types";
```

## API Documentation

When the backend is running, Swagger docs are available at:
```
http://localhost:3001/swagger
```

## Database

- **Provider:** PostgreSQL (hosted on [Neon](https://neon.tech))
- **ORM:** Prisma 7 with multi-file schema (`apps/backend/prisma/schema/`)
- **Models:** User, Product, Category, Order, OrderItem

## Dependency Management

- **pnpm workspaces** manage all packages from the root
- Shared dependencies are hoisted to the root via `shamefully-hoist=true`
- Workspace packages use `workspace:*` protocol for internal linking
- Each app can install its own dependencies freely
