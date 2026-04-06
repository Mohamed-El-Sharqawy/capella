<!--
SYNC IMPACT REPORT
==================
Version change: N/A (initial) → 1.0.0
Modified principles: N/A (initial ratification)
Added sections:
  - Core Principles I–V
  - Domain Constraints
  - Development Workflow
  - Governance
Removed sections: N/A
Templates requiring updates:
  ✅ .specify/templates/plan-template.md (monorepo structure + constitution gates)
  ✅ .specify/templates/spec-template.md (no structural changes needed)
  ✅ .specify/templates/tasks-template.md (monorepo path conventions added)
  ✅ .specify/templates/checklist-template.md (no changes needed)
  ✅ .specify/templates/agent-file-template.md (no changes needed)
Follow-up TODOs: None
-->

# Capella Constitution

## Core Principles

### I. Architectural Purity

The monorepo workspace boundary is strictly enforced:
- All deployable applications MUST reside within `apps/` (Backend, CMS, Marketing).
- All cross-app shared logic MUST reside within `packages/`:
  - `packages/shared-types/` for TypeScript interfaces, enums, and Zod schemas.
  - `packages/shared-utils/` for utility functions, constants, and validation helpers.
- No direct relative imports between apps are permitted.
- Cross-app dependency MUST flow exclusively through workspace packages
  using the `workspace:*` protocol.

**Rationale**: Prevents coupling between subsystems, ensures type safety
across the monorepo, and enforces a single source of truth for shared
contracts.

### II. Sub-System Consistency

Each subsystem MUST follow its prescribed modular pattern consistently:

- **Backend (ElysiaJS)**: Features MUST be organized as
  `src/modules/[feature]` with each module providing routes, services,
  and a consistent API structure. Prisma MUST be used for all database
  access. Every module MUST expose Swagger-documented endpoints.
- **Frontend (Next.js / React)**: The Marketing app and CMS MUST maintain
  structural parity. Any UI component used in both apps MUST be extracted
  to a shared UI library package. Component naming, file structure, and
  state management patterns MUST be consistent across frontend apps.

**Rationale**: Consistency reduces cognitive load, simplifies onboarding,
and prevents divergent patterns that complicate maintenance.

### III. Jewellery Brand Protocols

The following domain constraints are non-negotiable:

- **Currency**: The system is locked to AED (United Arab Emirates Dirham).
  Multi-currency support MUST NOT be implemented unless explicitly
  requested by the product owner.
- **Localization**: All user-facing content, titles, descriptions, and
  error messages MUST support Arabic (AR) and English (EN) translations.
  Frontend applications MUST handle RTL (right-to-left) layout for Arabic
  natively and elegantly. No placeholder or stub translations are
  permitted in production.
- **Payment**: Stripe standard business account integration ONLY. Stripe
  Connect, multi-vendor, or marketplace payment logic MUST NOT be
  introduced.

**Rationale**: Premature generalization adds complexity without delivering
value. These constraints reflect confirmed business requirements.

### IV. Media & Search

- **Media Management**: All images and videos MUST be uploaded,
  transformed, and served via Cloudinary. Local file storage for media
  assets is prohibited. All media URLs in the database and API responses
  MUST reference Cloudinary.
- **Search**: The platform MUST implement premium, predictive search
  overlays on the Marketing frontend. Search analytics (query terms,
  result counts, click-through rates) MUST be tracked and stored in the
  backend for analysis.

**Rationale**: Centralized media management ensures consistent delivery,
transformation, and caching. Search analytics drive product and UX
decisions.

### V. Structural Cleanliness & Code Reuse

Structural cleanliness and code reuse take priority over rapid, messy
implementation:

- If a TypeScript type, interface, or Zod schema is needed in more than
  one app, it MUST be moved to `packages/shared-types/` immediately.
- If a utility function, constant, or validation helper is needed in
  more than one app, it MUST be moved to `packages/shared-utils/`
  immediately.
- No duplication of business logic across apps. Shared logic MUST be
  extracted to the appropriate package.
- Every PR MUST be reviewed for extraction opportunities before merge.

**Rationale**: Duplication creates divergence. Early extraction prevents
technical debt accumulation and ensures consistency across the platform.

## Domain Constraints

**Technology Stack**:
- Runtime: Bun (backend), Node.js (frontend apps)
- Backend Framework: ElysiaJS
- Frontend Frameworks: Next.js 15 (Marketing), React + Vite (CMS)
- Styling: Tailwind CSS v4 + Shadcn/ui across all frontend apps
- Database: PostgreSQL (Neon), accessed exclusively via Prisma 7
- Package Manager: pnpm with workspaces

**Forbidden Patterns**:
- No multi-currency logic (AED only).
- No Stripe Connect / marketplace payment flows.
- No local media file storage (Cloudinary only).
- No direct inter-app imports bypassing `packages/`.
- No English-only content in production (AR/EN mandatory).
- No untyped `any` in shared packages.

## Development Workflow

**Code Review Requirements**:
- Every PR MUST pass constitution compliance check.
- Reviewers MUST verify: types/utilities extracted to packages when used
  cross-app, no forbidden patterns introduced, AR/EN translations
  provided for all user-facing strings.
- Constitution violations MUST be flagged as blocking review comments.

**Quality Gates**:
- `pnpm build` MUST succeed across all workspaces before merge.
- Prisma migrations MUST be validated before merge.
- No untyped `any` in shared packages.

**Branching & Commits**:
- Feature branches: `###-feature-name`
- Commit messages: conventional commits preferred.

## Governance

This constitution is the authoritative governance document for the
Capella monorepo. It supersedes all other practices, conventions, and
ad-hoc decisions.

**Amendment Procedure**:
1. Propose amendment with documented rationale.
2. Review impact on existing code and templates.
3. Update constitution with incremented version:
   - MAJOR: backward-incompatible principle removals or redefinitions.
   - MINOR: new principle/section added or materially expanded guidance.
   - PATCH: clarifications, wording, typo fixes, non-semantic refinements.
4. Propagate changes to all dependent templates and documentation.

**Compliance Review**:
- All PRs and reviews MUST verify compliance with this constitution.
- Complexity introduced without necessity MUST be justified in the PR
  description.
- Use `.specify/templates/` for feature planning workflow.

**Version**: 1.0.0 | **Ratified**: 2026-04-06 | **Last Amended**: 2026-04-06
