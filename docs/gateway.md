# Gateway Core (`@madinatyai/gateway`) — Business & Technical Documentation

> Unified API surface for every CoreMesh route, internal or external.
> Version 1.0 · June 2026 · Status: Draft, awaiting implementation.

---

## 1. Honest Framing — What This Is

A NestJS library that provides **one consistent way to expose an HTTP endpoint from CoreMesh**, no matter who calls it:

- Internal frontends (Platform Next.js, SoukElkanto Next.js, future Madinaty Kitchen / Tutor / TimeBank frontends, future Flutter mobile).
- Tenant staff dashboards.
- Third-party partners (Phase 2+ — via the Partner API auth layer that will run on top of this).
- Internal tooling and admin scripts.

What "consistent" means in practice:

| Concern | Today | After Gateway Core |
|---------|-------|----|
| URL convention | `/api/foo` (no versioning) | `/api/v1/foo` everywhere |
| Success response shape | Varies per controller | `{ success, data, message?, meta? }` always |
| Error response shape | Mostly default Nest | `{ success: false, error: { code, message, details? } }` always |
| Error codes | Ad-hoc strings | Closed enum (VALIDATION_ERROR, NOT_FOUND, ...) |
| Pagination | Different per endpoint | `?page=&limit=` + `meta.pagination` always |
| Rate limiting | Not yet wired | Multi-actor (user / partner / IP) with abstract storage |
| Audit logging | Ad-hoc | Automatic on every mutation route |
| Correlation IDs | Absent | Automatic via `@madinatyai/logging` |
| OpenAPI docs | Absent | Auto-generated at `/api/v1/docs` (Swagger UI) |
| Idempotency on writes | Absent | Optional `Idempotency-Key` header support |

## 2. What This Is NOT

- **Not a separate process / service.** Lives inside the existing NestJS app.
- **Not a reverse proxy.** That's Cloudflare / Nginx territory and stays out of CoreMesh.
- **Not a versioning compatibility layer.** It introduces `v1` for the first time; future `v2` is a separate URL surface, not in-place transformation.
- **Not partner-specific.** Partner API uses Gateway Core; so do JWT-authenticated internal routes. Auth scheme is independent of the gateway primitives.

---

## 3. Locked v1 Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| URL prefix | `/api/v1/*` on every route | Clean break point; aligns with global rules |
| Migration strategy | Big-bang — every existing CoreMesh route moves at once | Pre-launch, no real traffic; one breaking change is cheaper than two |
| Frontend impact | Platform/ follows in a separate PR within the same release | Solo / small team — no need for dual-shape coexistence |
| Old `/api/*` routes | Removed (no deprecation period) | No real users today |
| Rate limit storage | Abstract interface; in-process Map for v1; Redis for v2 | Avoid premature Redis dependency; preserve migration path |
| Idempotency key store | In-process Map for v1; Redis for v2 | Same |
| OpenAPI library | `@nestjs/swagger` | Reverses earlier decision; useful for internal consumers immediately |
| Pagination defaults | `page=1`, `limit=20`, max `limit=50` | Aligned with global rules |

---

## 4. Response Envelope Contract

### 4.1 Success

```json
{
  "success": true,
  "data": <payload>,
  "message": <optional human string>,
  "meta": {
    "correlationId": "00-4bf92f3577b34da6...-01",
    "ts": "2026-06-01T14:23:45.123Z",
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 437,
      "totalPages": 22
    }
  }
}
```

- `meta.pagination` is present ONLY for list endpoints.
- `meta.correlationId` and `meta.ts` are present on every response.

### 4.2 Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [
      { "field": "email", "rule": "isNotEmpty" }
    ]
  },
  "meta": {
    "correlationId": "00-4bf92f...",
    "ts": "2026-06-01T14:23:45.123Z"
  }
}
```

### 4.3 Standard error codes (closed enum)

| Code | HTTP | When |
|------|------|------|
| `VALIDATION_ERROR` | 400 | DTO validation failed |
| `BAD_REQUEST` | 400 | Malformed but not validation (e.g. unparseable JSON) |
| `UNAUTHORIZED` | 401 | No or invalid auth credential |
| `FORBIDDEN` | 403 | Authenticated but lacks permission |
| `NOT_FOUND` | 404 | Resource missing |
| `METHOD_NOT_ALLOWED` | 405 | HTTP method not supported on route |
| `CONFLICT` | 409 | State conflict (duplicate, race) |
| `UNPROCESSABLE_ENTITY` | 422 | Semantically invalid (post-validation) |
| `RATE_LIMIT_EXCEEDED` | 429 | Quota exceeded |
| `INTERNAL_ERROR` | 500 | Unhandled server-side |
| `BAD_GATEWAY` | 502 | Upstream failure (AI Router, etc.) |
| `SERVICE_UNAVAILABLE` | 503 | Maintenance / overload |
| `INSUFFICIENT_TRUST` | 403 | TrustScore ≤ ban threshold |
| `INSUFFICIENT_TOKENS` | 402 | Token wallet underflow on spend |
| `TENANT_NOT_RESOLVED` | 400 | Missing or invalid tenant context |
| `IDEMPOTENCY_KEY_REUSED` | 409 | Same key with different request body |
| `HMAC_INVALID` | 401 | Partner write request signature failed |
| `KEY_REVOKED` | 401 | API key revoked or expired |
| `WORKFLOW_VIOLATION` | 422 | Action invalid for current state machine state |

The enum is **closed**. Adding a new code requires a code change + spec amendment. Avoids drift.

---

## 5. URL Convention

| Pattern | Audience | Auth |
|---------|----------|------|
| `/api/v1/auth/*` | Anyone (public) | None / login flow |
| `/api/v1/me/*` | Authenticated user | JWT |
| `/api/v1/{resource}/*` | Authenticated user (resident, tenant staff, admin) | JWT |
| `/api/v1/admin/{resource}/*` | Platform admin | JWT + `@Roles(PLATFORM_ADMIN)` |
| `/api/v1/partner/{resource}/*` | Third-party partner (Phase 2+) | API Key (+ HMAC for writes) |
| `/api/v1/admin/partners/*` | Platform admin (Phase 2+) | JWT + `@Roles(PLATFORM_ADMIN)` |
| `/api/v1/docs` | Anyone | Swagger UI |
| `/api/v1/redoc` | Anyone | ReDoc alternative |
| `/api/v1/health` | Anyone | None |

Tenant context flows through `x-tenant-id` header OR `Host` subdomain — gateway does not introduce new mechanisms.

---

## 6. Library Layout

```
libs/gateway/
└── src/
    ├── gateway.module.ts
    ├── filters/
    │   └── all-exceptions.filter.ts       # builds the error envelope
    ├── interceptors/
    │   ├── response-envelope.interceptor.ts  # wraps return value in success envelope
    │   ├── access-log.interceptor.ts         # calls logger.access(...)
    │   ├── audit-log.interceptor.ts          # @AuditAction decorator → logger.audit(...)
    │   └── idempotency.interceptor.ts        # Idempotency-Key handling
    ├── guards/
    │   └── rate-limit.guard.ts               # multi-actor sliding window
    ├── decorators/
    │   ├── audit-action.decorator.ts         # @AuditAction({ action: 'KYC_APPROVED' })
    │   ├── pagination.decorator.ts           # @Pagination() inferred params
    │   ├── api-version.decorator.ts          # legacy/forward versioning
    │   └── correlation-id.decorator.ts       # surfaces ID from ALS
    ├── pagination/
    │   ├── page.dto.ts                       # ?page=&limit=
    │   ├── pagination.util.ts
    │   └── paged.response.ts
    ├── rate-limit/
    │   ├── rate-limit.strategy.ts            # interface
    │   ├── in-memory.strategy.ts             # v1 default
    │   ├── redis.strategy.ts                 # v2-ready, not wired in v1
    │   └── tier-config.ts                    # tier → limits mapping
    ├── idempotency/
    │   ├── idempotency.strategy.ts           # interface
    │   ├── in-memory.strategy.ts
    │   └── redis.strategy.ts                 # v2-ready
    ├── openapi/
    │   ├── swagger.config.ts                 # nests @nestjs/swagger setup
    │   └── error-schemas.ts                  # shared OpenAPI schemas
    ├── errors/
    │   ├── error-codes.ts                    # closed enum
    │   ├── gateway-exception.ts              # base class
    │   └── well-known-exceptions.ts          # VALIDATION_ERROR etc subclasses
    └── *.spec.ts
```

Path alias: `@madinatyai/gateway`.

Depends on `@madinatyai/logging` and `@madinatyai/common`.

---

## 7. Interceptor & Filter Composition

Global order (registered in `GatewayModule.forRoot()`):

```
HTTP request
    ↓
CorrelationIdMiddleware (from @madinatyai/logging) — sets AsyncLocalStorage
    ↓
Auth (existing guards — JwtAuthGuard or PartnerKeyGuard)
    ↓
RateLimitGuard (resolves actor → tier → strategy → 429 or pass)
    ↓
IdempotencyInterceptor (if request has Idempotency-Key header)
    ↓
@Roles() / @TenantGuard / @PartnerScopes() (route-specific)
    ↓
Controller handler
    ↓
ResponseEnvelopeInterceptor (wraps return into {success, data, meta})
    ↓
AuditLogInterceptor (if route is @AuditAction-decorated)
    ↓
AccessLogInterceptor (always — emits logger.access)
    ↓
AllExceptionsFilter (only on thrown errors — emits error envelope)
```

---

## 8. Rate Limiting

### 8.1 Actor model

The guard resolves the request to an "actor key" in this order:

1. If `req.partner` set → `partner:${partnerId}`
2. Else if `req.user` set → `user:${userId}`
3. Else → `ip:${clientIp}`

### 8.2 Tier mapping

| Actor type | Tier source |
|-----------|-------------|
| Partner (Phase 2+) | `Partner.planTier` (FREE/STARTER/PRO/ENTERPRISE — see Partner API spec) |
| Authenticated user | Default tier `USER` (60/min, 5000/day) |
| Anonymous IP | Default tier `ANON` (30/min, 500/day) |
| Admin | Default tier `ADMIN` (effectively unlimited at 600/min, 100000/day) |

Tiers are configurable via `GatewayModule.forRoot({ tiers: {...} })` and seeded with sane defaults.

### 8.3 Storage strategy interface

```typescript
interface RateLimitStrategy {
  check(actorKey: string, tier: TierConfig, now: Date): Promise<RateLimitResult>;
}

interface RateLimitResult {
  allowed: boolean;
  limitMinute: number;
  remainingMinute: number;
  limitDay: number;
  remainingDay: number;
  retryAfterSeconds?: number;
}
```

v1: `InMemoryRateLimitStrategy` using a `Map` + `setInterval` cleanup.
v2: `RedisRateLimitStrategy` using `INCR` + TTL keys.

### 8.4 Headers on every response

- `X-RateLimit-Limit-Minute`
- `X-RateLimit-Remaining-Minute`
- `X-RateLimit-Limit-Day`
- `X-RateLimit-Remaining-Day`
- `Retry-After` (on 429 only)

---

## 9. Audit Logging

```typescript
@Patch(':id/approve')
@AuditAction({ action: 'KYC_APPROVED', target: 'kyc_registry' })
async approve(@Param('id') id: string) {
  return this.kycService.approve(id);
}
```

The interceptor:

1. Captures actor (`req.user.id` or `req.partner.id`).
2. Resolves target type + id (from decorator + route params).
3. After handler completes, calls `logger.audit({ actor, action, target, outcome: 'success', metadata })`.
4. On thrown exception, emits `outcome: 'failure'` with redacted error.

What gets `@AuditAction`-decorated:

- KYC approvals/rejections
- Tenant tier changes
- Token wallet credits/debits
- Partner key issue/revoke/rotate
- TrustMeter manual bonus grants
- Any other administrative state-change or money-relevant operation

Pure-read endpoints are NOT audit-decorated; access logging covers them.

---

## 10. Idempotency Keys

### 10.1 Convention

Clients MAY send `Idempotency-Key: <opaque-string>` on `POST` and `PATCH`. The gateway records the first response and replays it on retries.

### 10.2 Behavior

- Key + (actorKey, method, path, requestBodyHash) is the lookup tuple.
- Same key + same body → replay cached response.
- Same key + DIFFERENT body → `IDEMPOTENCY_KEY_REUSED` 409.
- Key not present → normal processing.
- Cache window: 24 hours in v1.

### 10.3 Required vs optional

Idempotency is **opt-in** in v1 (clients send the header if they want it). v2 may mandate it for specific endpoints (e.g. payment-handle updates).

---

## 11. OpenAPI Integration

- `@nestjs/swagger` decorators on every controller and DTO.
- `GatewayModule` registers the document and serves:
  - Swagger UI at `/api/v1/docs`
  - ReDoc at `/api/v1/redoc`
  - Raw spec JSON at `/api/v1/openapi.json`
- The error envelope and all standard error codes are pre-registered as shared OpenAPI components — controllers reference them with one decorator.
- Title, version, contact info read from env / package.json.
- In production, the UI can be flag-disabled (`GATEWAY_DOCS_DISABLE=true`) but the JSON spec stays publicly accessible (read-only).

---

## 12. Pagination Utility

```typescript
@Get()
async list(@Pagination() page: PageDto): Promise<PagedResponse<Listing>> {
  const [items, total] = await this.service.findAll(page);
  return this.paginate(items, total, page);
}
```

`@Pagination()` decorator validates `?page=` (≥ 1) and `?limit=` (1–50, default 20) and surfaces a typed DTO. `this.paginate(...)` is a base-class helper returning the right shape for the envelope.

---

## 13. Migration Plan (existing CoreMesh modules)

All existing modules get a single migration pass under one PR / branch. Per-module checklist:

- [ ] Controller path prefix updated to include `v1/`.
- [ ] Default success response wrapped automatically by `ResponseEnvelopeInterceptor` — usually means controller methods return raw data without manual envelope.
- [ ] Existing exception throws migrate to `GatewayException` subclasses (`ValidationError`, `NotFoundError`, `ForbiddenError`, ...).
- [ ] List endpoints adopt `@Pagination()` decorator.
- [ ] Mutating endpoints get `@AuditAction({...})` where appropriate.
- [ ] DTOs adopt `@ApiProperty()` and `@ApiTags()` for OpenAPI.
- [ ] Tests updated to assert the new envelope shape.

Modules affected:

| Module | Routes | Migration scope |
|--------|--------|----|
| Health | 1 | trivial |
| Auth | ~4 | medium — public, no tenant |
| Users | ~3 | trivial |
| KYC | ~4 | medium — add @AuditAction |
| Reports | ~3 | trivial |
| Tenant | ~5 | medium |
| AI | ~3 | trivial |
| Tokens | ~6 | medium — add @AuditAction on credit/spend |
| TrustScore | ~2 | trivial (read-only) |
| TrustMeter | — | CANCELLED — TrustScore remains the reputation system |
| Souk ElKanto | ~25 | built fresh from these patterns |
| Partner API | ~10 | Phase 2+ — deferred until internal gateway is stable |

**Frontend follow-up (separate PR within same release):**

- Platform/ `src/lib/api/client.ts` — extract envelope, surface `data` to callers, raise typed errors on `success: false`.
- Same for SoukElkanto/web once it starts.

---

## 14. Testing Strategy

### 14.1 Library unit tests

- `ResponseEnvelopeInterceptor`: wraps various payload shapes; passes through pagination meta; preserves message field.
- `AllExceptionsFilter`: every standard error code → correct HTTP status + envelope shape; unknown exceptions → 500 INTERNAL_ERROR.
- `RateLimitGuard`: actor resolution precedence; tier lookup; allowed/denied paths; headers emitted on success and 429.
- `RateLimitStrategy` in-memory: window math, atomic increment, expiry.
- `IdempotencyInterceptor`: cache hit/miss; same-key-different-body 409; key TTL.
- `AuditLogInterceptor`: success outcome; failure outcome; metadata passthrough.
- `@Pagination()` decorator: validates limits; defaults applied.
- OpenAPI schema generation: error schemas referenced; tags applied.

Minimum: 40 unit tests for the library.

### 14.2 Integration tests

- Full request through real interceptor chain on a fixture controller.
- 429 path returns correct headers.
- Idempotency key replay round-trip.
- Audit emission verified via log capture.

Minimum: 8 integration tests.

### 14.3 Existing-module regression tests

For each migrated module:
- Same behavior, new envelope. Tests rewritten — assertion text changes from `expect(body.field).toBe(...)` to `expect(body.data.field).toBe(...)`.
- Error path tests: `expect(body.error.code).toBe('VALIDATION_ERROR')`.

---

## 15. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Big-bang migration breaks Platform/ frontend | Certain | Medium (pre-launch — no real users) | Platform follow-up PR scheduled in same release; deploy backend + frontend together |
| Existing 59-test baseline fails after migration | High | Medium | Test assertions are rewritten in the same PR as the controller change — tests + controllers move together |
| In-memory rate limit doesn't survive process restart | Certain | Low (pre-launch) | Document. Migrate to Redis strategy when traffic justifies. Strategy interface keeps the swap easy. |
| Idempotency cache TTL pollutes memory in long-running process | Medium | Low | Map cleanup setInterval; v2 Redis eliminates concern |
| OpenAPI spec drift from reality | Medium | Low | Generated from decorators on real controllers; if a route exists it's in the doc |
| `/api/v1/` move surprises external curl-using devs | Low | Low | None today. Document in CHANGELOG. |

---

## 16. v2 / v3 Roadmap

| Feature | Phase |
|---------|-------|
| Redis-backed rate limit + idempotency stores | v2 (drop-in via strategy interface) |
| `/api/v2/*` coexistence | When a real breaking change ships |
| GraphQL adapter alongside REST | If/when a frontend demands it |
| Outbound webhook signing (event push to partners) | v2 (Partner API related) |
| Request shaping / circuit breaker (call out to upstream like Ollama) | v2 |
| Per-route quota (separate from tier) | v2 |
| Dedicated gateway service extraction (Kong/Traefik) | v3 — at 5+ partners or 5M req/day |

---

## 17. Anti-Patterns to Avoid

- **Don't** add `/v1/` only to new routes. Big-bang migration is the whole point — half-migrated is worse than not migrated.
- **Don't** invent new error codes outside the closed enum. Extend the enum first, then use it.
- **Don't** bypass the envelope by returning raw `Response` objects. Use `GatewayException` for non-2xx.
- **Don't** log inside interceptors directly with `console`. Use the injected logger.
- **Don't** make the rate limit dependent on Redis being up. In-memory fallback in v1; degradation path in v2.
- **Don't** apply `@AuditAction` to read routes. Use access logging.
- **Don't** publish Swagger UI in production with admin endpoints exposed unauthenticated. The UI is public; the endpoints themselves stay auth-gated.

---

## 18. Glossary

| Term | Definition |
|------|------------|
| **Envelope** | The `{ success, data, meta }` or `{ success, error, meta }` JSON wrapper around every response |
| **Standard error code** | One of the closed enum values mapping to a stable HTTP status |
| **Actor** | The resolved identity making a request: partner, user, or anon IP |
| **Tier** | Rate-limit bucket controlling req/min and req/day |
| **Idempotency key** | Client-supplied opaque string ensuring write retries don't double-apply |
| **Audit action** | A state-changing event recorded with actor/action/target/outcome shape |
| **Strategy interface** | A pluggable storage backend (in-memory v1, Redis v2) for rate limit / idempotency |
