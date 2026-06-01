# Gateway Core — AI Implementation Prompt (for Claude Code on CoreMesh)

> Paste this prompt into Claude Code, opened at `F:\Web-Projects\MadinatyAI\CoreMesh\`.
> Run this AFTER the Logging library (`@madinatyai/logging`) is merged. Gateway depends on it.

---

```
You are a senior NestJS / OpenAPI engineer building @madinatyai/gateway — the unified API surface library for CoreMesh.

Every CoreMesh route (internal, partner, future) will use this library's primitives. You are also migrating the 6 existing modules to it in the same PR.

================================================================
CRITICAL — READ BEFORE WRITING ANY CODE
================================================================
1. Read `F:\Web-Projects\MadinatyAI\CLAUDE.md` — umbrella rules. Binding.
2. Read `F:\Web-Projects\MadinatyAI\CoreMesh\docs\architecture.md` — existing patterns.
3. Read `F:\Web-Projects\MadinatyAI\CoreMesh\docs\logging.md` — you DEPEND on @madinatyai/logging. Verify it is merged + green before you start.
4. Read `F:\Web-Projects\MadinatyAI\CoreMesh\docs\gateway.md` — full feature spec. **This is your binding specification.**

After reading, summarize back in 8–12 bullets:
  - The locked v1 decisions (versioning, migration strategy, storage strategies).
  - The success + error envelope shapes.
  - The closed error code enum and HTTP status mapping.
  - The interceptor / filter / guard composition order.
  - The rate-limit actor resolution order.
  - How Idempotency-Key works in v1.
  - Which existing modules need migration and what the migration touches.
  - How `@AuditAction` flows into logger.audit.
Wait for confirmation before writing code.

================================================================
NON-NEGOTIABLE INVARIANTS
================================================================
- URL prefix is `/api/v1/*` on EVERY route after migration. No `/api/*` survives.
- Response envelope shape is FIXED. ResponseEnvelopeInterceptor wraps every successful return automatically. Controllers should return raw data.
- Error code enum is CLOSED. Adding a new code requires editing `error-codes.ts`. No magic strings.
- AllExceptionsFilter handles ALL throws. Built-in Nest exceptions are converted to GatewayException subclasses at the boundary.
- Rate limit strategy is INTERFACE-DRIVEN. v1 ships in-memory only; Redis lives in the same library as an unused (but tested) class for v2.
- Idempotency cache is in-memory in v1 with same interface-driven design.
- Audit logging uses @madinatyai/logging's `logger.audit(...)` — never reimplement.
- Access logging is automatic on every request via AccessLogInterceptor → `logger.access(...)`.
- Correlation IDs are sourced from @madinatyai/logging's AsyncLocalStorage holder — never generate them in this library.
- `@nestjs/swagger` integration is REQUIRED in v1 (reversed from earlier draft). Decorators on every public route + DTO.
- Test baseline before this work: 12 suites / 59 tests (post-logging-library) MUST still pass after migration — assertions WILL be rewritten to match the new envelope shape, but the rewrites land in the SAME PR as the controller changes.
- No `any` types except where Prisma multiSchema dynamic delegate access requires it, with line-level eslint-disable + reason comment.
- ValidationPipe whitelist + transform + forbidNonWhitelisted on all DTOs.
- Conventional Commits. 0 lint errors, 0 TypeScript errors before each commit.
- Big-bang migration: every existing route moves at once. No half-migrated state allowed in any commit.

================================================================
DELIVERABLES
================================================================
1. New library `libs/gateway/` per gateway.md §6.
2. Path alias `@madinatyai/gateway` in tsconfig.base.json + tsc-alias.
3. Closed error code enum in `errors/error-codes.ts`.
4. `GatewayException` base class + well-known subclasses (`ValidationError`, `NotFoundError`, `ForbiddenError`, `UnauthorizedError`, `ConflictError`, `RateLimitError`, `InsufficientTrustError`, `InsufficientTokensError`, `TenantNotResolvedError`, `IdempotencyKeyReusedError`, `WorkflowViolationError`, `BadGatewayError`, `ServiceUnavailableError`).
5. `AllExceptionsFilter` — converts every throw (including standard `HttpException`) into the error envelope.
6. `ResponseEnvelopeInterceptor` — wraps return into success envelope; preserves pagination meta if interceptor sees the `Paged<T>` marker.
7. `RateLimitGuard` + `RateLimitStrategy` interface + `InMemoryRateLimitStrategy` + `RedisRateLimitStrategy` (Redis class is wired and tested but NOT registered by default; `GatewayModule.forRoot()` accepts a strategy override).
8. `IdempotencyInterceptor` + `IdempotencyStrategy` interface + `InMemoryIdempotencyStrategy`.
9. `AuditLogInterceptor` + `@AuditAction({ action, target })` decorator → `logger.audit(...)`.
10. `AccessLogInterceptor` — always-on → `logger.access(...)`.
11. `@Pagination()` decorator + `PageDto` + `PagedResponse<T>` + helper.
12. OpenAPI integration:
    - `@nestjs/swagger` installed.
    - Shared error schemas in `openapi/error-schemas.ts`.
    - Swagger UI at `/api/v1/docs`.
    - ReDoc at `/api/v1/redoc`.
    - Raw spec at `/api/v1/openapi.json`.
    - Production flag `GATEWAY_DOCS_DISABLE=true` hides the UI but keeps spec JSON public.
13. Migrate existing modules (every controller in the table at gateway.md §13):
    - Health, Auth, Users, KYC, Reports, Tenant, AI, Tokens, TrustScore.
    - TrustMeter — only if it has already merged; otherwise note as a coordination task.
    - For each: add `v1/` to path prefix, drop manual envelope code, add `@AuditAction` on state-changing routes, adopt `@Pagination()` on list routes, add `@ApiTags / @ApiProperty` decorators.
14. Rewrite ALL existing test assertions to match the new envelope (`expect(body.data.foo)`, `expect(body.error.code)`). Test files move with their controllers in the same commit.
15. Update `apps/core-hub/src/main.ts` to globally register: filter, interceptors, swagger setup.
16. Update `CoreMesh/docs/architecture.md` — replace old API table with the new `/api/v1/*` routes, mention Gateway Core in libs section.
17. Tests for the library itself:
    - Unit: ≥40 (per gateway.md §14.1).
    - Integration: ≥8 (per §14.2).
18. e2e: `apps/core-hub/test/gateway.e2e-spec.ts` exercising envelope, 429, idempotency replay, OpenAPI doc availability.

================================================================
PHASES (sequential — large work, ship in chunks)
================================================================
Phase A — Library skeleton + error system
  A1. Scaffold libs/gateway. Wire path alias.
  A2. Implement closed error code enum + GatewayException + subclasses.
  A3. Implement AllExceptionsFilter.
  A4. Implement ResponseEnvelopeInterceptor.
  A5. Unit tests for both (≥15 tests).

Phase B — Rate limiting + idempotency
  B1. RateLimitStrategy interface + InMemoryRateLimitStrategy + RedisRateLimitStrategy.
  B2. RateLimitGuard + actor resolution + tier-config.
  B3. IdempotencyStrategy interface + InMemoryIdempotencyStrategy + IdempotencyInterceptor.
  B4. Unit tests (≥15 tests).

Phase C — Audit + access logging + pagination
  C1. @AuditAction decorator + AuditLogInterceptor (consumes @madinatyai/logging).
  C2. AccessLogInterceptor (always-on).
  C3. @Pagination() decorator + PageDto + PagedResponse helper.
  C4. Unit tests (≥10 tests).

Phase D — OpenAPI
  D1. Install @nestjs/swagger.
  D2. Wire Swagger UI / ReDoc / JSON endpoints.
  D3. Shared error schemas reusable via @ApiResponse references.
  D4. Production toggle GATEWAY_DOCS_DISABLE.
  D5. Manual sanity check: open /api/v1/docs in a browser, see all routes.

Phase E — Migrate existing modules (ATOMIC — one commit per module IF possible, all in one PR)
  E1. Health — trivial.
  E2. Auth.
  E3. Users.
  E4. KYC — adds @AuditAction.
  E5. Reports.
  E6. Tenant.
  E7. AI.
  E8. Tokens — adds @AuditAction.
  E9. TrustScore.
  E10. TrustMeter (if merged).
  Each step:
    a. Update controller path to /api/v1/...
    b. Remove manual envelope wrapping; let interceptor handle it.
    c. Add @AuditAction on mutations.
    d. Adopt @Pagination on lists.
    e. Add @ApiTags / @ApiProperty.
    f. Rewrite tests for new envelope shape.
    g. Run `npx jest --ci` — must still be green before next module.

Phase F — Wire global + smoke test
  F1. Register filter, interceptors, swagger in apps/core-hub/src/main.ts.
  F2. e2e suite covering envelope, 429, idempotency, OpenAPI.
  F3. Update architecture.md.
  F4. Manual smoke: POST /api/v1/users with invalid body → VALIDATION_ERROR envelope.
  F5. Manual smoke: hit /api/v1/health 200 times → 429 with correct headers.
  F6. Manual smoke: /api/v1/docs renders.

================================================================
COMMUNICATION RULES
================================================================
- Summarize understanding BEFORE writing code. Wait for confirmation.
- After each phase: short status update — what shipped, tests passing, any open questions.
- After Phase E: list which modules migrated cleanly and which needed special handling.
- If a module migration reveals an existing bug, report it but do NOT fix in this PR — file a follow-up.
- 3-strike rule on errors.
- If you discover that a deferred concern (e.g. settle window in TrustMeter) is actually blocking, STOP and ask before pulling it in.

================================================================
SUCCESS CRITERIA
================================================================
- All 6 phases complete.
- 0 lint errors, 0 typecheck errors.
- Existing 59-test baseline (now using new envelope) passes — same count or higher.
- New gateway library tests: ≥40 unit, ≥8 integration, ≥5 e2e.
- Every existing route under /api/v1/*.
- Swagger UI loads at /api/v1/docs showing every route grouped by @ApiTags.
- Sample curl: `curl -X POST /api/v1/tokens/credit -H "Authorization: Bearer <admin-jwt>" -d '...'` returns success envelope.
- Sample curl: `curl /api/v1/users/nonexistent` returns 404 with `error.code = "NOT_FOUND"`.
- npm audit clean.

================================================================
DO NOT
================================================================
- DO NOT leave any /api/* route un-migrated.
- DO NOT change controller business logic during migration — only paths, envelopes, decorators, and tests.
- DO NOT add new endpoints or features. This is foundation + migration only.
- DO NOT skip the OpenAPI work. Swagger UI is part of v1.
- DO NOT use Redis in v1. Strategy interfaces are designed for v2 Redis swap; the actual Redis class ships unused.
- DO NOT log inside interceptors with console — use injected LoggerService from @madinatyai/logging.
- DO NOT bypass the envelope by returning raw Response objects.
- DO NOT couple GatewayModule to Partner API. Partner API depends on Gateway; not vice versa.
- DO NOT touch Souk ElKanto or TrustMeter feature work. They build on the new patterns from scratch.

Start by summarizing your understanding. Then proceed to Phase A.
```

---

## How to use this

1. Verify `@madinatyai/logging` is merged + green.
2. `cd F:\Web-Projects\MadinatyAI\CoreMesh && claude`.
3. Paste the prompt block above.
4. Approve phase-by-phase. Phase E (migration) is the riskiest — review each module's commit before approving the next.

**After this lands:** the Platform/ frontend needs a follow-up PR to consume the new envelope. That work is in `Platform/docs/api-envelope-migration.md` (to be written separately).
