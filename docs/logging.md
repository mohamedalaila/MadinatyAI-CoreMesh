# Unified Logging (`@madinatyai/logging`) — Business & Technical Documentation

> Reusable logging library for the entire MadinatyAI ecosystem.
> Version 1.0 · June 2026 · Status: Draft, awaiting implementation.

---

## 1. What This Is

A single, opinionated logging library used by:

- **CoreMesh** (NestJS backend)
- **Platform/** (Next.js, server-side log routes + API handlers)
- **SoukElkanto/web/** (Next.js)
- **Future Madinaty Kitchen / Tutor / TimeBank** modules and frontends
- **Future Flutter mobile** (via FFI or sister library — see §10)

It replaces ad-hoc `console.log`, raw NestJS `Logger`, and stack-specific patterns with one structured, scrubbed, correlation-aware logger.

---

## 2. Why a Shared Library

| Problem (today) | Solution |
|-----------------|----------|
| Each codebase invents its own log format | One JSON shape across the ecosystem |
| Sensitive data leaks into logs (KYC, JWTs, API keys, payment handles) | Centralized scrub rules — opt-in once, applied everywhere |
| Cannot trace a request across CoreMesh + frontend + DB | W3C traceparent injected automatically; same correlation ID in every log line for one request |
| Audit events scattered (or absent) | First-class `logger.audit()` helper writing to a separate stream |
| Production debugging requires SSH-ing to a box | Structured JSON consumable by Loki / ELK / CloudWatch with no transformation |
| Compliance asks "who did what when" | Audit stream answers it in one query |

---

## 3. Design Principles

1. **Structured JSON only.** Every line is a single JSON object. No pretty-printed multi-line stack traces in production output.
2. **Two file targets per process** (per global rules): `.log` for all levels, `.err` for ERROR/FATAL only. Filename format `YYYYMMDD_HHMMSS.log` / `.err`, UTF-8. Stays on disk for short-term diagnosis; long-term lives in aggregator.
3. **Console stdout JSON** for container collection (Docker / Vercel / Kubernetes).
4. **Sensitive fields scrubbed by default.** Hard list, configurable extension. Cannot be disabled in production.
5. **Correlation IDs are non-optional.** Generated at edge if missing.
6. **Audit + security streams are distinct.** Operational logs and audit trails answer different questions; never tangle them.
7. **NestJS-compatible.** Drop-in replacement for the default `Logger` so existing `Logger.log(...)` calls keep working while gradually migrating to richer helpers.
8. **Cheap.** Built on `pino` (high-throughput, async, well-maintained). Logging should never be the bottleneck.

---

## 4. Locked v1 Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Underlying library | `pino` 8.x + `pino-pretty` (dev only) | Fastest mainstream Node logger; first-class JSON; well-typed |
| File rotation | None in v1 — fresh file per process start (filename includes timestamp) | Avoids the `pino-roll` dependency; aligns with global "filename per run" rule |
| Log levels | `trace`, `debug`, `info`, `warn`, `error`, `fatal` | pino standard |
| Default level | `info` in production, `debug` in development | Env-driven via `LOG_LEVEL` |
| Streams | `console`, `file:.log`, `file:.err`, optional `aggregator` (future) | All targets receive the same JSON shape |
| Correlation ID source | W3C `traceparent` header preferred; uuid v4 fallback | Open standard, traceable cross-service |
| PII scrub | Hardcoded denylist + user-extensible | Cannot be disabled at runtime in production env |
| Audit retention | Logger emits; storage decision deferred (file + future aggregator) | Don't couple library to a specific storage decision |

---

## 5. Library Layout

```
libs/logging/
└── src/
    ├── logging.module.ts
    ├── logger.service.ts            # primary injectable
    ├── nest-logger.adapter.ts       # NestJS LoggerService adapter
    ├── correlation/
    │   ├── correlation.middleware.ts
    │   ├── correlation.context.ts   # AsyncLocalStorage holder
    │   └── traceparent.ts           # W3C parser
    ├── scrub/
    │   ├── scrub.ts                 # PURE — field redaction
    │   └── default-rules.ts         # denylist constants
    ├── streams/
    │   ├── file.stream.ts           # two-file output (.log + .err)
    │   ├── console.stream.ts
    │   └── stream.types.ts
    ├── helpers/
    │   ├── audit.ts                 # logger.audit(...)
    │   ├── security.ts              # logger.security(...)
    │   └── access.ts                # logger.access(...)
    ├── pino-config.ts
    └── *.spec.ts
```

Path alias: `@madinatyai/logging`.

---

## 6. The Logger API

### 6.1 Constructor / DI

```typescript
import { Module } from '@nestjs/common';
import { LoggingModule } from '@madinatyai/logging';

@Module({
  imports: [
    LoggingModule.forRoot({
      service: 'core-hub',                 // identifies the codebase
      logDir: process.env.LOG_DIR ?? './logs',
      level: process.env.LOG_LEVEL ?? 'info',
      env: process.env.APP_ENV ?? 'development',
      scrubExtraKeys: ['adminToken', 'tenantSecret'], // optional additions
    }),
  ],
})
export class AppModule {}
```

### 6.2 Standard log calls

```typescript
constructor(private readonly logger: LoggerService) {}

this.logger.info('User onboarded', { userId, district });
this.logger.warn('Rate limit approaching', { apiKeyId, count, limit });
this.logger.error('DB write failed', { err, query });
this.logger.debug('Cache miss', { key });
```

Every emission produces JSON like:

```json
{
  "ts": "2026-06-01T14:23:45.123Z",
  "level": "info",
  "service": "core-hub",
  "env": "production",
  "correlationId": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
  "userId": "...",
  "msg": "User onboarded"
}
```

### 6.3 Audit helper

```typescript
this.logger.audit({
  actor: { type: 'user', id: userId },
  action: 'KYC_APPROVED',
  target: { type: 'kyc_registry', id: kycId },
  outcome: 'success',
  reason: null,
  metadata: { reviewerId },
});
```

Emits to BOTH the standard log streams AND a marker `stream: "audit"` for downstream filtering.

### 6.4 Security helper

```typescript
this.logger.security({
  severity: 'medium',
  type: 'HMAC_SIGNATURE_INVALID',
  partnerId,
  apiKeyId,
  reason: 'timestamp_out_of_window',
  ip,
});
```

Tags with `stream: "security"`. Reserved for: auth failures, replay attempts, rate-limit hits, suspicious patterns, KYC anomalies.

### 6.5 Access log helper

```typescript
this.logger.access({
  method: 'POST',
  path: '/api/v1/listings',
  status: 201,
  durationMs: 47,
  userId,
  tenantId,
  apiKeyId,
  bytesIn: 2048,
  bytesOut: 512,
});
```

Tags with `stream: "access"`. Called automatically by the Gateway Core HTTP interceptor — applications usually do not call this directly.

### 6.6 NestJS adapter

For existing code using `new Logger('MyService')`:

```typescript
const logger = new Logger('OffersService');
logger.log('Offer accepted'); // routes through @madinatyai/logging adapter
```

Drop-in. Existing 59-test baseline keeps working without touching call sites.

---

## 7. Correlation IDs

### 7.1 Sources & precedence

1. Incoming `traceparent` header (W3C Trace Context format)
2. Incoming `x-correlation-id` header (legacy/simple)
3. Generated server-side as `traceparent` if neither present

### 7.2 Storage

`CorrelationContext` uses `AsyncLocalStorage` so every downstream log call inherits the ID automatically — no manual passing.

### 7.3 Outbound propagation

When CoreMesh calls another service (e.g. AI Router HTTP call to Ollama), the correlation middleware injects `traceparent` into the outbound headers. Frontend code (Platform / Souk) propagates from incoming browser request to outbound API call.

### 7.4 Frontend integration (Next.js)

The library publishes a Next.js helper `withCorrelationId(handler)` for API routes. Frontend logs in Platform/ and SoukElkanto/web/ pick up the same trace context.

---

## 8. Sensitive Field Scrubbing

### 8.1 Default denylist (always-on)

```typescript
const DEFAULT_SCRUB_KEYS = [
  // Auth
  'password', 'passwordHash', 'token', 'accessToken', 'refreshToken',
  'jwt', 'bearer', 'authorization',
  // API keys (Partner API)
  'apiKey', 'apiSecret', 'hmacSecret', 'keyHash', 'secretHash',
  'x-api-key', 'x-api-signature',
  // KYC
  'nationalId', 'idNumber', 'kycPayload', 'encryptedId', 'idImage',
  // Financial / payment handles (broker stance)
  'instapayHandle', 'vodafoneCashNumber', 'bankAccount', 'iban', 'cardNumber',
  'cvv', 'cardPan',
  // PII (case-by-case)
  'email', 'phone', 'phoneNumber', 'address', 'gpsLocation',
  // Internal
  'webhookSecret', 'adminToken', 'cookie', 'set-cookie',
];
```

### 8.2 Scrub algorithm

- Recursive walk of any logged object.
- Match by key name, case-insensitive.
- Replace value with `'[REDACTED]'` (string) or `null` (for non-string types) — the redaction is recorded but the shape preserved.
- For strings that *look* like a JWT (regex `/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/`), `[REDACTED-JWT]`.
- For Bearer tokens in `authorization` header strings, replace the value after the space.
- **Never** scrub fields named `userId`, `tenantId`, `partnerId` — these are essential for tracing.

### 8.3 Extension (per-codebase)

```typescript
LoggingModule.forRoot({
  scrubExtraKeys: ['kantoSafeMeetCoords', 'tutorCalendarToken'],
});
```

Additions are merged into the denylist at startup.

### 8.4 Production lock

In `APP_ENV=production`, scrub rules cannot be disabled at runtime. The library throws on startup if a config requests disabling.

---

## 9. File Output (Two-File Strategy)

Per global rule:

| File | Levels | Format |
|------|--------|--------|
| `logs/YYYYMMDD_HHMMSS.log` | `trace`, `debug`, `info`, `warn`, `error`, `fatal` | one JSON object per line |
| `logs/YYYYMMDD_HHMMSS.err` | `error`, `fatal` only | `[TIMESTAMP] [LEVEL] [TYPE] location | message` text format |

**Why text format for `.err`:** matches the global rule for quick human grep. JSON `.log` is for machines; `.err` is for "I want to see what blew up in the last hour without `jq`".

Directory `logs/` is created at boot if missing. Files NEVER rotate within a single process — one process run = one log file. Killing and restarting the process generates new filenames (timestamp differs).

---

## 10. Frontend Integration (Next.js)

The library exposes a smaller sibling export for Next.js:

```typescript
import { createNextLogger } from '@madinatyai/logging/next';

const logger = createNextLogger({ service: 'platform', logDir: '.next/logs' });

export async function POST(req: Request) {
  logger.info('Enrollment received', { email });
  // ...
}
```

On Vercel (where filesystem is ephemeral) the file stream is replaced with a no-op; stdout JSON is the only target. Documented as a known limitation.

---

## 11. Mobile (Flutter)

Out of scope for v1. A sister Dart package `madinatyai_logging` will provide the same JSON shape, scrub rules, and correlation propagation. Scheduled with the Flutter app build (Phase 2 of Souk ElKanto).

---

## 12. Testing

### 12.1 Unit tests

- **scrub.ts (PURE):** every default key redacted; nested objects walked; JWT regex; case-insensitive; non-string values null'd; circular references handled.
- **correlation parser:** valid traceparent → parsed; missing → generated; malformed → generated with warning.
- **NestJS adapter:** `Logger.log()` calls route through new logger.
- **file streams:** correct filename format; UTF-8; `.err` filter excludes < ERROR levels.
- **audit/security/access helpers:** correct stream tag; required fields enforced.

### 12.2 Integration tests

- Request flow: incoming traceparent → service log emits with same correlation → outbound HTTP gets same traceparent.
- Production env: attempting to disable scrub throws on startup.

### 12.3 Performance test

- 10k log events/sec sustained for 60s; p99 emission latency < 1ms; no event loop blocking.

Minimum: 25 unit tests, 6 integration tests.

---

## 13. Migration Guide (for existing codebases)

### 13.1 CoreMesh

1. `npm install @madinatyai/logging` (workspace dep).
2. Replace `LoggerModule` import (if any) with `LoggingModule.forRoot(...)`.
3. Replace `import { Logger } from '@nestjs/common'` calls with `LoggerService` injection — no behavior change.
4. Remove ad-hoc `console.log` calls. Run `npm run lint` with `no-console` enabled to enforce.
5. Add `logger.audit(...)` at every approval / status-change / write-elevation site.

### 13.2 Platform/

1. `npm install @madinatyai/logging`.
2. Use `@madinatyai/logging/next` in API routes.
3. Wrap route handlers with `withCorrelationId(...)`.
4. Remove `console.log` from server-side code.

### 13.3 SoukElkanto/web/

Same as Platform/ — adopted from the first commit, no migration needed.

---

## 14. Configuration Reference

Environment variables read on startup:

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_ENV` | `development` | One of `development`, `testing`, `staging`, `production` |
| `LOG_LEVEL` | `info` (prod) / `debug` (dev) | Minimum level to emit |
| `LOG_DIR` | `./logs` | Directory for file outputs |
| `LOG_DISABLE_FILE` | `false` | Set to `true` only in containerized envs that aggregate stdout |
| `LOG_DISABLE_CONSOLE` | `false` | Set to `true` only when running a long-lived process with file-only logs |
| `LOG_SERVICE_NAME` | (required) | Identifies the codebase in every emission |

---

## 15. Glossary

| Term | Definition |
|------|------------|
| **Correlation ID** | A trace-context-compliant string identifying a single end-user request across services |
| **Audit stream** | Subset of logs tagged `stream: "audit"` — actor/action/target/outcome shape |
| **Security stream** | Subset tagged `stream: "security"` — auth failures, replays, rate-limit hits |
| **Access stream** | Subset tagged `stream: "access"` — one entry per HTTP request, populated by Gateway Core |
| **Scrub** | The act of redacting sensitive field values from log output |
| **Two-file strategy** | One `.log` (everything) + one `.err` (errors only) per process per run |
