# Partner API — Business & Technical Documentation

> **MadinatyAI Ecosystem Hub** — Partner-facing authentication layer built on top of `@madinatyai/gateway`.
> Version 1.1 · June 2026 · Status: **DEFERRED (Phase 2+)** — Gateway Core + Logging must ship first; Partner API builds on top of them.

---

## 1. Honest Framing — What This Is and Is NOT

**What this is:** A NestJS library that adds a **second authentication scheme** (API Key + HMAC) to CoreMesh, plus the admin tooling to issue and manage partner keys. It SITS ON TOP OF `@madinatyai/gateway` — every envelope, error code, rate-limit primitive, audit log, and OpenAPI registration uses the Gateway Core library; Partner API only contributes the partner-specific pieces.

**What this is NOT:** A separate gateway service (Kong, Traefik, AWS API Gateway). Those are network-layer products. **It is also NOT the unified API surface itself** — that's `@madinatyai/gateway`. Partner API is the auth scheme that lets external developers use that surface.

**When you should regret this choice:** When you have ≥ 5 partners each pushing ≥ 1M req/day, OR you need request transformation between API versions, OR compliance requires a documented gateway component. At that point, extract to a dedicated gateway service. The Partner API design keeps that migration path open — it's a thin layer, not a leaky abstraction.

---

## 1.5 Dependency on Gateway Core (NEW in v1.1)

This document assumes `@madinatyai/gateway` is merged and operating. Specifically, Partner API relies on Gateway Core for:

- **Versioning:** All Partner API routes live under `/api/v1/partner/*` and `/api/v1/admin/partners/*`.
- **Envelope:** Success + error responses are produced by Gateway Core's `ResponseEnvelopeInterceptor` and `AllExceptionsFilter`.
- **Error codes:** Use Gateway Core's closed enum. New codes added in this work: `HMAC_INVALID`, `KEY_REVOKED`. Both already pre-registered in Gateway Core.
- **Rate limiting:** Use Gateway Core's `RateLimitGuard` + `InMemoryRateLimitStrategy` (Redis swap in v2). Partner tier mapping (FREE/STARTER/PRO/ENTERPRISE) is provided via Gateway Core's `tierConfig` overrides.
- **Idempotency:** Use Gateway Core's `IdempotencyInterceptor` on write endpoints.
- **Audit logging:** Use Gateway Core's `@AuditAction` decorator on partner / key state changes.
- **OpenAPI:** Use Gateway Core's Swagger setup — partner endpoints get tagged `@ApiTags('partner')` or `@ApiTags('admin:partners')`.

Partner API does **NOT** reimplement any of the above. If something is missing in Gateway Core, fix it there, not here.

---

## 2. Locked v1 Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth model | API Key + HMAC signature (HMAC required for **write**, optional for **read**) | Defends against replayed leaked keys on write paths without making read integrations painful |
| Billing | Flat tier quotas only — no token debit in v1 | Simpler to ship; token-debit hook lives in v2 |
| Outbound webhooks | Not in v1 — partners poll | Cuts ~3 days of work; revisit when first partner asks |
| Sandbox environment | Single environment in v1 | Defer until partner volume justifies |
| Developer portal UI | Admin issues keys via API | Self-serve UI is v2 |
| Versioning | `/api/v1/partner/*` and `/api/v1/admin/partners/*` | Aligned with Gateway Core's `/api/v1/` migration |
| Daily cleanup cron | DROPPED from v1 — table-growth is documented but not an active concern at zero traffic | Re-introduce when usage rows cross 100k OR migrate to Redis (TTL auto-expires) |
| OpenAPI docs | Inherited from Gateway Core at `/api/v1/docs` | Reverses earlier "skip Swagger" call — Gateway Core makes it free |
| Cleanup of public-data sample endpoints | DROPPED — `/api/v1/partner/categories` and `/api/v1/partner/safe-meet-spots` removed from this scope | These belong to Souk ElKanto's own opt-in partner-route exposure |

---

## 3. Business Model

### 3.1 Why Partners

Madinaty.AI's data is interesting to:
- **Real-estate aggregators** (rental listings cross-posted from Rental Portal when launched)
- **Property managers / HOA tools** (resident directory, service-provider lookups)
- **Insurance brokers** (pre-vetted resident pool — anonymized)
- **Logistics / delivery startups** (Safe Meet Spot APIs once normalized)
- **Civic-tech researchers** (anonymized community signal data)
- **Future ecosystem extensions** (your own partner-built tenants)

### 3.2 Plan Tiers (admin-configurable, seeded defaults)

| Tier | Req/min | Req/day | Concurrent connections | Cost (offline) | Use case |
|------|---------|---------|------------------------|----------------|----------|
| **FREE** | 30 | 1,000 | 5 | 0 EGP | Hobbyist devs, evaluation |
| **STARTER** | 120 | 10,000 | 20 | 500 EGP/month | Small integrations |
| **PRO** | 600 | 100,000 | 100 | 4,000 EGP/month | Production partners |
| **ENTERPRISE** | custom | custom | custom | Negotiated | SLA-backed, dedicated support |

> **Broker stance preserved:** Plan fees are collected **offline** (same as token wallet model). The platform records the tier; cash never touches the server.

### 3.3 Coarse Scopes (v1)

| Scope | Grants access to |
|-------|------------------|
| `read:public` | Any endpoint marked publicly readable (listings, categories, public profiles, trust-score user views, safe-meet-spots, AI tools directory) |
| `read:partner` | Partner's own profile, usage stats, API key info |
| `write:partner` | Partner can call write endpoints on their own resources (rotate key, update webhook URL placeholder for v2) |

Future granular scopes will follow `read:tenant:<subdomain>` and `write:tenant:<subdomain>` patterns. Reserved namespace from v1.

### 3.4 Partner Lifecycle

```
INVITED → ACTIVE → SUSPENDED → REVOKED
         ↑                ↑
       admin            admin
       approves         pauses (with reason)
```

- **INVITED** — Partner row exists, no API key issued yet.
- **ACTIVE** — One or more API keys issued.
- **SUSPENDED** — All keys frozen; partner can read `/api/v1/partner/me` to see suspension reason.
- **REVOKED** — Partner removed; all keys hard-disabled; can be re-activated by admin.

---

## 4. Authentication Scheme

### 4.1 Read requests (HMAC optional)

```http
GET /api/v1/partner/listings?district=B5 HTTP/1.1
Host: api.madinatyai.com
X-Api-Key: mai_live_pk_abc123def456...
```

### 4.2 Write requests (HMAC required)

```http
PATCH /api/v1/partner/me/api-keys/rotate HTTP/1.1
Host: api.madinatyai.com
Content-Type: application/json
X-Api-Key: mai_live_pk_abc123def456...
X-Api-Timestamp: 1717248000
X-Api-Signature: 9f4a8b...
```

Where:
```
X-Api-Signature = HMAC-SHA256(secret, "${timestamp}.${HTTP_METHOD}.${PATH}.${rawBody}")
```

### 4.3 Signing rules

- `timestamp` MUST be within **±300 seconds** of server time (replay window).
- `rawBody` is the literal body bytes (UTF-8). For empty bodies, use empty string (`""`).
- `PATH` includes the query string (e.g., `/api/v1/partner/listings?district=B5`).
- Server stores the **timestamp** of each successful signed request to reject duplicates within the window.

### 4.4 API key format

- Prefix: `mai_live_pk_` (live keys) or `mai_test_pk_` (placeholder, unused in v1).
- 32 bytes random, base64url-encoded after the prefix.
- Public part returned ONCE on creation. Server stores only `sha256(key)`.
- Each key has a corresponding **HMAC secret** (also returned once, also stored hashed).

### 4.5 Guards execution order (NestJS)

```
PartnerKeyGuard
  ├─ extract X-Api-Key, sha256, lookup ApiKey row + Partner
  ├─ reject if status != ACTIVE or expired
  ├─ if HTTP method is POST/PATCH/PUT/DELETE → require HMAC signature
  │    └─ validate timestamp, body hash, signature, replay table
  └─ attach req.partner + req.apiKey + scopes
PartnerScopesGuard
  └─ check route's @PartnerScopes() decorator vs req.apiKey.scopes
PartnerRateLimitGuard
  ├─ build key: `partner:${partnerId}:${tier}:${window}`
  ├─ Redis sliding-window check
  └─ 429 if exceeded; surface Retry-After + X-RateLimit-* headers
```

JWT-authenticated routes (existing) and partner-authenticated routes (new) are **mutually exclusive at the controller level**. A single route does not accept both.

---

## 5. Technical Architecture

### 5.1 Library Layout (mirrors existing patterns)

```
libs/partner-api/
└── src/
    ├── partner-api.module.ts
    ├── services/
    │   ├── partners.service.ts          # Partner CRUD + lifecycle
    │   ├── api-keys.service.ts          # key issue/rotate/revoke; hashing
    │   ├── partner-rate-limit.service.ts # sliding-window + tier lookup
    │   └── hmac.service.ts              # PURE — signature gen + verify
    ├── guards/
    │   ├── partner-key.guard.ts
    │   ├── partner-scopes.guard.ts
    │   └── partner-rate-limit.guard.ts
    ├── decorators/
    │   ├── partner-scopes.decorator.ts
    │   └── current-partner.decorator.ts
    ├── controllers/
    │   ├── admin-partners.controller.ts  # /api/v1/admin/partners/*
    │   └── partner-self.controller.ts    # /api/v1/partner/me/*
    ├── dto/
    │   ├── create-partner.dto.ts
    │   ├── issue-api-key.dto.ts
    │   ├── rotate-api-key.dto.ts
    │   └── update-plan-tier.dto.ts
    ├── constants/
    │   └── default-plan-tiers.ts
    └── *.spec.ts (one per service/guard)
```

Path alias: `@madinatyai/partner-api`.

### 5.2 Prisma Schema (additions to `core` schema, matching existing style — no `@db.*`, no `@@map`)

```prisma
model Partner {
  id              String              @id @default(uuid())
  name            String
  contactEmail    String
  contactPhone    String?
  status          PartnerStatus       @default(INVITED)
  planTier        PartnerPlanTier     @default(FREE)
  suspendedReason String?
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  apiKeys         ApiKey[]
  usageRecords    ApiKeyUsage[]

  @@schema("core")
}

model ApiKey {
  id            String     @id @default(uuid())
  partnerId     String
  partner       Partner    @relation(fields: [partnerId], references: [id])
  keyPrefix     String     @unique           // public, e.g. "mai_live_pk_abc1..."
  keyHash       String                       // sha256(fullKey)
  secretHash    String                       // sha256(hmacSecret)
  scopes        String[]                     // ["read:public", "read:partner", "write:partner"]
  status        ApiKeyStatus @default(ACTIVE)
  expiresAt     DateTime?
  lastUsedAt    DateTime?
  revokedAt     DateTime?
  rotatedFromId String?                      // chain of rotations for audit
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  @@schema("core")
}

model ApiKeyUsage {
  id          String    @id @default(uuid())
  apiKeyId    String
  partnerId   String
  partner     Partner   @relation(fields: [partnerId], references: [id])
  windowStart DateTime                       // start of bucket (e.g. minute or day)
  windowKind  ApiKeyUsageWindow              // MINUTE | DAY
  count       Int       @default(0)

  @@unique([apiKeyId, windowKind, windowStart])
  @@schema("core")
}

model ApiKeySignatureReplay {
  apiKeyId    String
  timestamp   Int                            // unix seconds
  signature   String                         // first 16 hex chars suffices for replay key
  createdAt   DateTime  @default(now())

  @@id([apiKeyId, timestamp, signature])
  @@schema("core")
}

enum PartnerStatus {
  INVITED
  ACTIVE
  SUSPENDED
  REVOKED
  @@schema("core")
}

enum PartnerPlanTier {
  FREE
  STARTER
  PRO
  ENTERPRISE
  @@schema("core")
}

enum ApiKeyStatus {
  ACTIVE
  REVOKED
  EXPIRED
  @@schema("core")
}

enum ApiKeyUsageWindow {
  MINUTE
  DAY
  @@schema("core")
}
```

**Storage notes:**

- `keyHash` and `secretHash` are SHA-256 of the plaintext returned **once** at creation. No plaintext ever stored.
- `ApiKeyUsage` uses upsert + atomic increment. Redis-backed counters in v2; DB-counters acceptable in v1 (Postgres handles 1M+ counter rows trivially with daily cron cleanup).
- `ApiKeySignatureReplay` rows expire via daily cron (delete where `createdAt < now() - 1 hour`).

### 5.3 Rate Limit Strategy (v1)

- **In-process sliding window** using Postgres `ApiKeyUsage` rows.
- Per-request flow:
  1. Compute current MINUTE bucket start (e.g. `2026-06-01T14:23:00Z`).
  2. Compute current DAY bucket start (e.g. `2026-06-01T00:00:00Z`).
  3. Atomically `upsert ... count = count + 1` for both rows.
  4. If MINUTE count > tier minute limit OR DAY count > tier day limit → 429.
- Response headers always include:
  - `X-RateLimit-Limit-Minute`, `X-RateLimit-Remaining-Minute`
  - `X-RateLimit-Limit-Day`, `X-RateLimit-Remaining-Day`
  - `Retry-After` on 429
- Daily cron: delete `ApiKeyUsage` rows older than 7 days.

**v2 swap:** Replace `ApiKeyUsage` row writes with Redis `INCR` + TTL. Same service interface.

### 5.4 Endpoints

#### 5.4.1 Admin endpoints — `PLATFORM_ADMIN` JWT only

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/admin/partners` | Create partner (status defaults to `INVITED`) |
| GET | `/api/v1/admin/partners` | List + filter partners |
| GET | `/api/v1/admin/partners/:id` | Get partner detail with API key summary |
| PATCH | `/api/v1/admin/partners/:id` | Update name / contact / plan tier / status |
| POST | `/api/v1/admin/partners/:id/api-keys` | Issue new API key (returns plaintext **once**) |
| GET | `/api/v1/admin/partners/:id/api-keys` | List partner's API keys (no plaintext) |
| PATCH | `/api/v1/admin/api-keys/:id/revoke` | Hard-revoke a key |
| PATCH | `/api/v1/admin/api-keys/:id/rotate` | Rotate (creates a new key, marks old as `REVOKED` after grace period) |
| GET | `/api/v1/admin/partners/:id/usage` | Aggregated usage report by day/hour |

#### 5.4.2 Partner self endpoints — Partner API Key auth

| Method | Path | Purpose | HMAC required |
|--------|------|---------|---------------|
| GET | `/api/v1/partner/me` | Own profile | No |
| GET | `/api/v1/partner/me/usage?from=...&to=...` | Usage stats | No |
| GET | `/api/v1/partner/me/api-keys` | List own keys (no plaintext) | No |
| POST | `/api/v1/partner/me/api-keys/rotate` | Rotate own key — returns new key + secret **once** | **Yes** |

#### 5.4.3 Public-data partner endpoints (sample for v1 — extends per service)

These are wrappers around existing CoreMesh data, scoped for partner consumption (different from internal `/api/...` routes — no PII, no internal IDs in some cases).

| Method | Path | Scope | HMAC required |
|--------|------|-------|---------------|
| GET | `/api/v1/partner/listings` | `read:public` (per-tenant subset) | No |
| GET | `/api/v1/partner/listings/:id` | `read:public` | No |
| GET | `/api/v1/partner/trust-score/users/:userId` | `read:public` | No |
| GET | `/api/v1/partner/safe-meet-spots` | `read:public` | No |
| GET | `/api/v1/partner/categories` | `read:public` | No |

Each tenant module decides what subset to expose under `/api/v1/partner/*` — opt-in, never automatic mirroring. This keeps PII control with the tenant owner.

### 5.5 OpenAPI / Documentation

- Add `@nestjs/swagger` decorators to all Partner API controllers.
- Serve at `/api/v1/partner/docs` (Swagger UI) — public, no auth required.
- ReDoc alternative at `/api/v1/partner/redoc`.
- A separate `partner-api.openapi.json` artifact is published on `npm version`-style releases so partners can codegen clients.

---

## 6. Security Considerations

| Concern | Mitigation |
|---------|-----------|
| Key leakage in logs | NestJS interceptor scrubs `X-Api-Key` and `X-Api-Signature` from every log; `lastUsedAt` updates use the **id**, never the plaintext |
| Replay attacks on write | HMAC signature + ±300s timestamp window + `ApiKeySignatureReplay` table |
| Brute-force key guessing | Partner key prefix is the lookup index; full hash compared in constant time; failed lookups rate-limited per IP (separate Throttler) |
| Privilege escalation across partners | Every query in Partner controllers filters by `req.partner.id` automatically via a `@CurrentPartner()` decorator; never trust route params alone |
| Cross-tenant data leak | `/api/v1/partner/*` endpoints are scoped per partner; no `x-tenant-id` header recognized on partner routes — partners can't impersonate tenants |
| HMAC secret leak | Stored hashed; rotated together with API key on rotation |
| Suspended partner still reading | `PartnerKeyGuard` rejects status != ACTIVE on every request (no caching the partner row for more than 30s) |
| DoS via 429 cost | Rate limiter check happens **before** any DB joins; only one indexed lookup |
| Slowloris / connection exhaustion | Handled by Nginx/Cloudflare layer if/when deployed; not Partner API's concern |
| Logging PII in usage reports | Usage reports show counts only, no user IDs or content snippets |

---

## 7. Observability

| Signal | Where |
|--------|-------|
| Request count per partner per day | `ApiKeyUsage` table; admin endpoint exposes |
| 4xx/5xx rate per partner | Standard NestJS interceptor → metrics (OpenTelemetry-ready) |
| HMAC failures | Logged with partnerId + reason ("BAD_TIMESTAMP", "BAD_SIG", "REPLAY") |
| Rate-limit-exceeded events | Logged + counter; alarm if a single partner trips > 100/hour |
| Latency per endpoint | OpenTelemetry spans |

---

## 8. Testing Strategy

### 8.1 Unit tests

- **HmacService** (PURE): signature gen + verify round-trip; tampered body fails; tampered timestamp fails; right secret, wrong path fails.
- **PartnerRateLimitService**: window math, increment, threshold crossings.
- **ApiKeysService**: issue → returns plaintext once; rotate → old key inactive after grace; revoke → key dead.
- **PartnerKeyGuard**: missing key → 401; bad key → 401; expired → 401; suspended partner → 403; HMAC missing on write → 401; HMAC bad → 401; replay → 401; happy path → attaches req.partner.

### 8.2 Integration tests

- Full request flow: admin creates partner → issues key → partner calls public-read endpoint → success.
- Rate-limit: 31st call in a minute on FREE tier returns 429 with correct headers.
- Rotation: old key works during grace, dies after.
- Suspended partner: any request returns 403.

### 8.3 e2e tests

- `apps/core-hub/test/partner-api.e2e-spec.ts` exercises the full admin + partner flow against the real Postgres.

Minimum: 30 new unit tests, 8 new integration tests, 5 new e2e tests.

---

## 9. Migration & Operational Concerns

- **Migration:** `prisma migrate dev --name add_partner_api`.
- **No backfill needed** — net-new tables.
- **Seed:** `default-plan-tiers.ts` constant; service ensures plan tier definitions exist on boot (idempotent).
- **Daily cron:** delete `ApiKeyUsage` > 7 days, `ApiKeySignatureReplay` > 1 hour.
- **Cron implementation:** `@nestjs/schedule` `@Cron('0 3 * * *')` daily at 3am Cairo time.

---

## 10. v2 / v3 Roadmap

| Feature | Phase |
|---------|-------|
| Closed-loop token debit per API call | v2 — adds `tokenCostPerCall` to plan tier or per endpoint |
| OAuth2 client credentials flow alongside API keys | v2 |
| Outbound webhooks (signed events back to partners) | v2 |
| Developer self-serve portal UI | v2 |
| Sandbox environment | v2 |
| Granular per-endpoint scopes | v2 |
| Redis-backed rate limiting | v2 — drop-in via service interface |
| Extract to dedicated gateway service (Kong/Traefik) | v3 — triggered by ≥ 5 partners OR ≥ 5M req/day OR compliance audit |
| API marketplace + public discovery | v3 |

---

## 11. Anti-Patterns to Avoid

- **Do not** reuse JWT auth for partners. Two auth schemes, mutually exclusive at the controller level.
- **Do not** let partners pass `x-tenant-id`. Partners are NOT tenant staff.
- **Do not** expose internal `/api/*` routes to partners by accident. Partner endpoints live under `/api/v1/partner/*` and `/api/v1/admin/*`. Internal routes stay internal.
- **Do not** mirror tenant routes 1:1. Each tenant explicitly opts-in by exporting a `partner-routes.ts` map.
- **Do not** log API keys, HMAC secrets, or signatures. Ever. Pre-commit hook + interceptor + linter rule.
- **Do not** rate-limit by IP for partners. They might be behind shared NAT or serverless. Rate limit by `apiKeyId`.
- **Do not** ship without the daily cleanup cron — `ApiKeySignatureReplay` will balloon.

---

## 12. Glossary

| Term | Definition |
|------|------------|
| **Partner** | An external organization with API access to Madinaty.AI ecosystem APIs |
| **API Key** | A long-lived bearer credential issued to a Partner; has scopes, a tier, and a status |
| **HMAC Secret** | A per-key shared secret used to sign write requests |
| **Plan Tier** | Quota bucket (FREE / STARTER / PRO / ENTERPRISE) controlling req/min and req/day limits |
| **Scope** | A coarse permission string (`read:public`, `read:partner`, `write:partner`) |
| **Replay window** | ±300 seconds — signed requests outside this window are rejected |
| **Sliding window** | Rate-limit algorithm using MINUTE + DAY buckets |
