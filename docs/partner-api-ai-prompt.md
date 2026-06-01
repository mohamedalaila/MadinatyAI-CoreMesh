# Partner API — AI Implementation Prompt (for Claude Code on CoreMesh)

> **Status: DEFERRED (Phase 2+)** — Do not execute until `@madinatyai/gateway` and `@madinatyai/logging` are merged and green.
> Paste this prompt into Claude Code, opened at `F:\Web-Projects\MadinatyAI\CoreMesh\`.
> Read `partner-api.md` first; this prompt is the execution wrapper.

---

```
You are a senior NestJS engineer adding a new shared library to the MadinatyAI Ecosystem Hub (CoreMesh): the Partner API. This sits ON TOP of @madinatyai/gateway (the unified API surface library) and adds the partner-specific authentication scheme (API Key + HMAC) plus admin/self management endpoints. It is NOT a separate service — it lives inside the same NestJS app.

CRITICAL DEPENDENCY: @madinatyai/logging AND @madinatyai/gateway MUST be merged and green before you start. Verify their tests pass. If not, STOP and raise the dependency blocker.

================================================================
CRITICAL — READ BEFORE WRITING ANY CODE
================================================================
1. Read `F:\Web-Projects\MadinatyAI\CLAUDE.md` — umbrella rules. Binding.
2. Read `F:\Web-Projects\MadinatyAI\CoreMesh\docs\architecture.md` — existing patterns.
3. Read `F:\Web-Projects\MadinatyAI\CoreMesh\docs\logging.md` AND `F:\Web-Projects\MadinatyAI\CoreMesh\docs\gateway.md` — MANDATORY DEPENDENCIES. Verify both libraries are merged before proceeding.
4. Read `F:\Web-Projects\MadinatyAI\CoreMesh\docs\token-wallet.md` — for stylistic precedent on services.
5. Read `F:\Web-Projects\MadinatyAI\CoreMesh\docs\partner-api.md` — full feature spec. **This is your binding specification.** Note §1.5 — every primitive comes from Gateway Core; you only add partner-specific logic.

After reading, summarize back in 5–10 bullets:
  - What the Partner API is and why it is NOT a separate gateway service.
  - The auth model and its split between read (key-only) and write (key + HMAC).
  - The data model you will add.
  - The libraries / modules you will create.
  - How rate limiting works in v1 (Postgres-backed, swappable for Redis later).
Wait for confirmation before writing code.

================================================================
NON-NEGOTIABLE INVARIANTS
================================================================
- Partner API is ADDITIVE. Do not modify JWT auth, TenantMiddleware, KYC, Wallet, TrustScore, TrustMeter, Gateway Core, or Logging libraries. Only extend.
- Partner-authenticated routes and JWT-authenticated routes are MUTUALLY EXCLUSIVE per controller. A single route accepts ONE auth scheme.
- All Partner API data lives in the `core` schema. No tenant tables.
- Path alias `@madinatyai/partner-api`. Depends on `@madinatyai/gateway` AND `@madinatyai/logging`.
- Match existing Prisma style — no `@db.Uuid`, `@db.VarChar`, `@@map`. Use `@@schema("core")`.
- Use `/api/v1/` prefix on all routes — inherited from Gateway Core migration.
- HMAC required on POST/PATCH/PUT/DELETE. Optional on GET. Per partner-api.md §4.
- Replay window ±300s, idempotency table `ApiKeySignatureReplay`. No daily cleanup cron in v1 (dropped per spec §2 amendment).
- API keys + HMAC secrets stored as `sha256` hashes only. Plaintext returned ONCE on creation.
- Partner cannot pass `x-tenant-id`. Partner routes ignore that header entirely.
- Rate limiting is provided by Gateway Core's `RateLimitGuard` — DO NOT reimplement. You only contribute the partner tier configurations to GatewayModule.forRoot().
- Constant-time comparison for key hashes (`crypto.timingSafeEqual`).
- All write endpoints use Gateway Core's `IdempotencyInterceptor` — DO NOT reimplement.
- All admin endpoints use Gateway Core's `@AuditAction({...})` decorator — DO NOT reimplement audit logging.
- All public routes use Gateway Core's `@ApiTags` and OpenAPI decorators — Swagger UI at `/api/v1/docs` will show partner endpoints automatically.
- No `any` types EXCEPT where Prisma multiSchema dynamic delegate access is unavoidable — in those cases, line-level `// eslint-disable-next-line @typescript-eslint/no-explicit-any` with a reason comment.
- ValidationPipe whitelist/transform/forbidNonWhitelisted on all DTOs.
- Conventional Commits. 0 lint errors, 0 TypeScript errors before each commit.
- Existing test baseline (12 suites / 59 tests — post-Gateway-Core migration, all under new envelope) MUST still pass.

================================================================
DELIVERABLES
================================================================
1. New library `libs/partner-api/` with the layout from partner-api.md §5.1.
2. Prisma schema additions per partner-api.md §5.2 — 4 models + 4 enums.
3. Path alias `@madinatyai/partner-api` in tsconfig.base.json + tsc-alias config.
4. Wire `PartnerApiModule` into apps/core-hub/src/app/app.module.ts.
5. Admin endpoints per partner-api.md §5.4.1 — gated by JWT + @Roles(PLATFORM_ADMIN).
6. Partner self endpoints per partner-api.md §5.4.2 — gated by PartnerKeyGuard.
7. Public-data partner endpoints are DROPPED from v1 scope. No `/api/v1/partner/categories`, no `/api/v1/partner/safe-meet-spots`. The library exposes ONLY admin endpoints (`/api/v1/admin/partners/*`) and partner-self endpoints (`/api/v1/partner/me/*`) in v1. Document in the library README that tenant modules opt-in their own partner routes by importing `PartnerApiModule`'s guards.
8. Migration: `prisma migrate dev --name add_partner_api`.
9. Seed: `default-plan-tiers.ts` — idempotent seed of plan tier configs.
10. NO daily cleanup cron in v1 (dropped from scope). Document the table-growth concern in the library README with two remediation options for when it becomes relevant: (a) reintroduce a cron, or (b) migrate `ApiKeyUsage` / `ApiKeySignatureReplay` to Redis with native TTL.
11. OpenAPI documentation: INHERITED from Gateway Core. Just add `@ApiTags('partner')` / `@ApiTags('admin:partners')` and `@ApiProperty()` on DTOs. Swagger UI is already at `/api/v1/docs` — no extra wiring.
12. Tests:
    - Unit: HmacService (PURE), ApiKeysService, PartnerRateLimitService, all guards. ≥30 tests.
    - Integration: full flow admin → issue key → partner reads, rotation, revoke, rate limit, suspended partner. ≥8 tests.
    - e2e: apps/core-hub/test/partner-api.e2e-spec.ts. ≥5 scenarios.
13. Logging interceptor that scrubs `X-Api-Key`, `X-Api-Signature`, and any `keyHash`/`secretHash` from log lines.
14. Update `CoreMesh/docs/architecture.md` — add Partner API as a new system component + mention `@madinatyai/partner-api` in the libs table.

================================================================
PHASES (sequential within each; A and B can run in parallel after schema is in)
================================================================
Phase A — Schema + Pure HMAC
  A1. Add Prisma models per spec. Run prisma migrate dev. Run prisma generate.
  A2. Create libs/partner-api scaffold.
  A3. Implement HmacService (PURE, no DB). Full unit tests including tamper + replay-window.
  A4. Implement default-plan-tiers.ts seed constants.

Phase B — Services (parallel with C after A done)
  B1. PartnersService (CRUD + lifecycle).
  B2. ApiKeysService (issue/rotate/revoke; hashing; constant-time compare; plaintext-once contract).
  B3. PartnerRateLimitService (sliding window via Postgres ApiKeyUsage, interface allows Redis swap later).
  B4. Unit tests for all three.

Phase C — Guards & Decorators (parallel with B)
  C1. PartnerKeyGuard (extract key → lookup → status check → HMAC required-for-write check → attach req.partner).
  C2. PartnerScopesGuard + @PartnerScopes() decorator.
  C3. PartnerRateLimitGuard (calls PartnerRateLimitService).
  C4. @CurrentPartner() param decorator.
  C5. Unit tests for guards using @nestjs/testing.

Phase D — Controllers
  D1. AdminPartnersController — all /api/v1/admin/* routes from §5.4.1.
  D2. PartnerSelfController — all /api/v1/partner/me/* routes from §5.4.2.
  D3. Two sample public-data partner endpoints (categories, safe-meet-spots).
  D4. Swagger decorators on all routes.
  D5. Wire PartnerApiModule into AppModule.
  D6. Integration tests.

Phase E — Tier registration + integration polish
  E1. Register PARTNER tier configs (FREE/STARTER/PRO/ENTERPRISE) into GatewayModule.forRoot() via a module-side contribution helper.
  E2. Verify rate-limit headers (provided by Gateway Core) appear correctly on partner routes by integration test.
  E3. Verify the @madinatyai/logging scrub list already covers X-Api-Key, X-Api-Signature, keyHash, secretHash (it does — confirm by test).
  E4. NO daily cron. Document table-growth concern in libs/partner-api/README.md.

Phase F — Docs + e2e
  F1. e2e tests (apps/core-hub/test/partner-api.e2e-spec.ts).
  F2. Update CoreMesh/docs/architecture.md.
  F3. README in libs/partner-api/ explaining how a tenant module opts-in a partner endpoint.

================================================================
COMMUNICATION RULES
================================================================
- Summarize understanding BEFORE writing code. Wait for confirmation.
- After each phase: short status update (what shipped, tests passing, open questions).
- 3-strike rule: if same error recurs 3 times, stop and ask before reverting.
- If a spec section is ambiguous, ASK. If implementation reveals a spec contradiction, FLAG IT and propose a resolution.
- Never log API keys, HMAC secrets, signatures, key hashes, secret hashes, JWTs, or PII.

================================================================
SUCCESS CRITERIA
================================================================
- All 6 phases complete.
- 0 lint errors, 0 typecheck errors.
- Existing baseline preserved: post-Gateway-Core migration (≥12 suites / ≥59 tests, all under new envelope) still green.
- New Partner API tests: ≥30 unit, ≥8 integration, ≥5 e2e.
- `npm audit` clean.
- Prisma schema validates.
- Architecture doc updated.
- Manual sanity check: issue a FREE-tier key, hit GET /api/v1/partner/categories 31 times in a minute → 31st returns 429 with Retry-After.
- Manual sanity check: rotate a key → old key dies after grace; new key works immediately.
- Manual sanity check: signed write request with stale timestamp (> 300s) returns 401.

================================================================
DO NOT
================================================================
- DO NOT reuse JWT auth for partners. Distinct guards, distinct controllers.
- DO NOT let partner routes accept x-tenant-id header.
- DO NOT mirror internal /api/* routes to /api/v1/partner/*. Tenants opt-in explicitly.
- DO NOT store plaintext API keys, HMAC secrets, or signatures. Hash everything.
- DO NOT skip the cron — replay table will grow unbounded.
- DO NOT introduce Redis in v1. Postgres-backed sliding window is the v1 contract.
- DO NOT add outbound webhooks. Polling only in v1.
- DO NOT add OAuth2 client credentials flow. API key + HMAC only in v1.
- DO NOT add granular per-endpoint scopes. Coarse-grained only: read:public, read:partner, write:partner.
- DO NOT add token-debit billing. Flat-tier quotas only.
- DO NOT log secrets. Logging interceptor must scrub them.
- DO NOT use `any` except where Prisma multiSchema delegate access requires it, with line-level eslint-disable + reason comment.

Start by summarizing your understanding. Then proceed to Phase A.
```

---

## How to use this

1. Open Claude Code: `cd F:\Web-Projects\MadinatyAI\CoreMesh && claude`.
2. Paste the prompt block above (between the triple backticks) as your first message.
3. Wait for summary. Verify it matches `partner-api.md`.
4. Approve Phase A. Review schema + HMAC tests.
5. Repeat per phase. After Phase F, run the three manual sanity checks listed.

---

## Sequencing note

Partner API depends on **none of any future feature's models**. It can be built independently. The only merge concerns are:

- Both may add migrations to `prisma/migrations/`. Run them in sequence when merging — the names won't conflict.
- Both add modules to `app.module.ts`. Trivial merge.
- Both add path aliases to `tsconfig.base.json`. Trivial merge.

No circular dependencies. No shared models.
