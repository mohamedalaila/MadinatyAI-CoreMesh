# Business Sub-Tenancy Plan — Kitchen & Tutor

## Overview
Add row-level sub-multi-tenancy to Kitchen and Tutor schemas so each business (restaurant, tutor) gets its own visual identity, subdomain, and data isolation within the shared tenant schema.

---

## Phase 1: Prisma Schema + Migration
- [ ] Add `KitchenBusiness` model to `tenant_kitchen` schema (slug, branding JSON, business profile fields)
- [ ] Update `KitchenMenuItem` to reference `KitchenBusiness` via `businessId` FK
- [ ] Add `TutorBusiness` model to `tenant_tutor` schema (slug, branding JSON, subjects, hourlyRate)
- [ ] Update `TutorBooking` to reference `TutorBusiness` via `businessId` FK
- [ ] Run `npx prisma migrate dev` and verify tables in DB
- [ ] Update seed script to create sample businesses

## Phase 2: Business Library (`libs/business`)
- [ ] Create `libs/business` with module, service, DTOs, exceptions
- [ ] `BusinessService` methods:
  - `createBusiness(tenant, ownerGlobalUserId, slug, name, branding?)` — register a business
  - `getBusiness(tenant, slug)` — lookup by slug
  - `listBusinesses(tenant, filters?)` — paginated listing
  - `updateBranding(tenant, businessId, branding)` — update visual identity
  - `updateProfile(tenant, businessId, profile)` — update business info
  - `deactivateBusiness(tenant, businessId)` — soft delete
- [ ] DTOs: `CreateBusinessDto`, `UpdateBrandingDto`, `UpdateBusinessProfileDto`
- [ ] Exceptions: `BusinessNotFoundException`, `DuplicateSlugException`
- [ ] Service uses `PrismaService.withTenantSchema()` for all queries

## Phase 3: Business Middleware + Guard
- [ ] Create `BusinessMiddleware` — resolves sub-subdomain (e.g. `ali.kitchen.madinatyai.com` → `slug=ali`)
- [ ] Store resolved `businessId` in `TenantContextService` (extend with `businessId` and `businessSlug` fields)
- [ ] Create `BusinessGuard` — ensures business context is present for business-scoped endpoints
- [ ] Wire middleware after `TenantMiddleware` in `app.module.ts`

## Phase 4: Business Controller (`apps/core-hub`)
- [ ] Create `BusinessController` with endpoints:
  - `POST /api/business` — create business (TENANT_ADMIN or PROVIDER)
  - `GET /api/business/:slug` — get business by slug (public)
  - `GET /api/business` — list businesses (public)
  - `PATCH /api/business/:id/branding` — update branding (owner or admin)
  - `PATCH /api/business/:id/profile` — update profile (owner or admin)
  - `DELETE /api/business/:id` — deactivate (owner or PLATFORM_ADMIN)
- [ ] Wire into `app.module.ts`

## Phase 5: Tests
- [ ] Unit tests for `BusinessService` (8+ tests: CRUD, duplicate slug, not found, branding update)
- [ ] Unit tests for `BusinessController` (6 tests: all endpoints)
- [ ] Unit tests for `BusinessMiddleware` (3 tests: resolve slug, missing slug, invalid slug)
- [ ] Run full test suite, lint, build, prisma validate

## Phase 6: Documentation
- [ ] Update `docs/architecture.md` — add business library, middleware, guard, endpoints
- [ ] Create `docs/business-sub-tenancy.md` — business/technical doc for sub-tenancy
- [ ] Update `docs/token-wallet.md` — note that tokens work across businesses
- [ ] Commit and push

---

## Design Decisions
1. **Row-level isolation** — one schema per app, `businessId` FK for data scoping
2. **Sub-subdomain routing** — `ali.kitchen.madinatyai.com` → tenant_kitchen + businessId
3. **Branding as JSON** — flexible, no schema changes for new branding fields
4. **Slug-based URLs** — SEO-friendly, human-readable business identifiers
5. **Only Kitchen & Tutor** — Souq is a marketplace (listings, not businesses), TimeBank is peer-to-peer
