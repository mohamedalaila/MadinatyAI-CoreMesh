# Unified Logging — AI Implementation Prompt (for Claude Code on CoreMesh)

> Paste this prompt into Claude Code, opened at `F:\Web-Projects\MadinatyAI\CoreMesh\`.
> This library is foundational — build it FIRST, before Gateway Core, before Partner API, before any other in-flight work.

---

```
You are a senior Node.js / NestJS engineer building a shared library for the MadinatyAI ecosystem: @madinatyai/logging.

This is the SHARED LOGGING FOUNDATION. Every other CoreMesh library and every frontend codebase (Platform/, SoukElkanto/web/) will consume it. Get the API right; downstream consumers depend on stability.

================================================================
CRITICAL — READ BEFORE WRITING ANY CODE
================================================================
1. Read `F:\Web-Projects\MadinatyAI\CLAUDE.md` — umbrella rules. The "Logging" section there is BINDING (two-file strategy, UTF-8, filename format YYYYMMDD_HHMMSS).
2. Read `F:\Web-Projects\MadinatyAI\CoreMesh\docs\architecture.md` — existing patterns.
3. Read `F:\Web-Projects\MadinatyAI\CoreMesh\docs\logging.md` — full feature spec. **This is your binding specification.**

After reading, summarize back in 6–10 bullets:
  - The 7 design principles.
  - The default scrub denylist and how additions work.
  - The two-file output strategy (.log + .err) and filename format.
  - The audit / security / access helpers — what each is for.
  - Correlation ID source order and AsyncLocalStorage usage.
  - The NestJS Logger adapter contract.
Wait for confirmation before writing code.

================================================================
NON-NEGOTIABLE INVARIANTS
================================================================
- Build on `pino` 8.x. No alternative loggers.
- Sensitive data scrubbing is ALWAYS-ON in production. Library MUST throw on startup if config tries to disable it when APP_ENV=production.
- Two file targets per process per run. Filename `YYYYMMDD_HHMMSS.log` + `.err`. UTF-8. No rotation; one file per process start.
- `.log` is line-delimited JSON. `.err` is human-grep text format: `[TIMESTAMP] [LEVEL] [TYPE] context | message`.
- Correlation IDs use W3C `traceparent`. AsyncLocalStorage holds the current ID. NEVER pass correlation IDs as method arguments — that's a code smell.
- NestJS `Logger.log(...)` MUST keep working after migration (drop-in adapter). Existing 59-test baseline cannot break.
- Sensitive default keys (see logging.md §8.1) are HARDCODED. Extension is additive only.
- Audit stream is for `actor/action/target/outcome` events ONLY. Mixing operational logs into audit stream is a defect.
- No `any` types. No `console.log` anywhere in the library itself.
- Path alias `@madinatyai/logging`.
- Library exports: main entry for Node/NestJS; secondary `@madinatyai/logging/next` for Next.js consumers.
- The library must NOT depend on `@nestjs/*` packages — pino is framework-agnostic. The NestJS adapter is in a sub-export (`@madinatyai/logging/nest`) that's optional.
- Conventional Commits. 0 lint errors, 0 TypeScript errors before each commit.

================================================================
DELIVERABLES
================================================================
1. New library `libs/logging/` with layout per logging.md §5.
2. Path alias `@madinatyai/logging` in `tsconfig.base.json` and `tsc-alias` config. Additional sub-export aliases for `/next` and `/nest`.
3. Three entry points:
   - `@madinatyai/logging` — pure logger + scrub + correlation (zero NestJS deps).
   - `@madinatyai/logging/nest` — NestJS `LoggingModule.forRoot()` + LoggerService injectable + adapter for built-in NestJS Logger.
   - `@madinatyai/logging/next` — Next.js helper `createNextLogger` + `withCorrelationId(handler)` route wrapper.
4. PURE scrub function (`libs/logging/src/scrub/scrub.ts`) with ALL tests for: every default key, nested objects, JWT regex, Bearer header, circular refs, case-insensitive, never-scrub-list (userId/tenantId/partnerId).
5. Correlation middleware that parses incoming `traceparent` / `x-correlation-id`; falls back to generated traceparent; stores in AsyncLocalStorage.
6. Outbound correlation propagation helper for axios/fetch.
7. File streams using pino's multistream — separate sinks for `.log` (all levels JSON) and `.err` (ERROR/FATAL only text format).
8. Three structured helpers: `logger.audit(...)`, `logger.security(...)`, `logger.access(...)` — each emits with required fields and a stream tag.
9. NestJS `LoggerService` adapter so existing `new Logger('Foo').log(...)` calls route through @madinatyai/logging unchanged.
10. Env-driven config loading: APP_ENV, LOG_LEVEL, LOG_DIR, LOG_DISABLE_FILE, LOG_DISABLE_CONSOLE, LOG_SERVICE_NAME.
11. Validate config on startup; throw clear errors with remediation hints.
12. Tests:
    - Unit: scrub (≥15 cases), correlation parser (≥6 cases), file stream filename format, .err text format, helpers required-fields enforcement.
    - Integration: nestjs adapter (`Logger.log` lands in our streams), multistream output, env-disabled in production throws.
13. Performance test: 10k events/sec sustained for 60s without backpressure (use `pino`'s async + sonic-boom).
14. README in `libs/logging/` explaining the three entry points + a quickstart for each.

================================================================
PHASES (sequential)
================================================================
Phase A — Pure Core
  A1. Set up libs/logging scaffold and the three entry-point aliases.
  A2. Implement PURE scrub function + default-rules + complete unit tests.
  A3. Implement correlation parser (traceparent) + AsyncLocalStorage holder + unit tests.

Phase B — Pino Wiring
  B1. Implement pino config + multistream (console + file:.log + file:.err).
  B2. Custom serializer that runs scrub before emit.
  B3. Filename generator (YYYYMMDD_HHMMSS).
  B4. Unit tests for file output + format.

Phase C — Helpers
  C1. logger.audit(...) — actor/action/target/outcome shape; stream:audit tag; required-fields enforcement.
  C2. logger.security(...) — severity/type/required context; stream:security tag.
  C3. logger.access(...) — HTTP request shape; stream:access tag.
  C4. Unit tests for each.

Phase D — NestJS Adapter
  D1. `LoggingModule.forRoot()` + `LoggerService` injectable.
  D2. NestJS `LoggerService` adapter so the built-in Logger routes through us.
  D3. Express/Fastify middleware that creates correlation context per request.
  D4. Integration tests using a tiny NestJS app fixture.

Phase E — Next.js Helper
  E1. `createNextLogger()` returning the same interface, no-op file stream on serverless.
  E2. `withCorrelationId(handler)` wrapper for API routes.
  E3. Integration test on a tiny Next.js fixture.

Phase F — Migration prep + README
  F1. Migration guide (logging.md §13) confirmed accurate; add code samples.
  F2. README explaining quickstart for Node, NestJS, Next.js.
  F3. Manually validate CoreMesh and Platform/ can install + use the lib without breaking existing tests.

================================================================
COMMUNICATION RULES
================================================================
- Summarize understanding before writing code. Wait for confirmation.
- After each phase: short status update (what shipped, tests passing, open questions).
- If existing tests in CoreMesh start failing because of the adapter wiring, STOP and ask. Do not "fix" tests by changing assertions.
- 3-strike rule on errors.
- Never log raw KYC, JWT, API key, secret, or payment-handle data — even in tests.

================================================================
SUCCESS CRITERIA
================================================================
- All 6 phases complete.
- 0 lint errors, 0 TypeScript errors.
- Existing CoreMesh baseline (12 suites / 59 tests) still passes after wiring the adapter.
- New logging tests: ≥25 unit, ≥6 integration.
- Performance: 10k events/sec sustained without dropping events; p99 < 1ms emission.
- Three quickstart examples in the README run cleanly.
- A test that calls `process.env.APP_ENV='production'` then tries `LoggingModule.forRoot({ scrubExtraKeys: [], disableScrub: true })` MUST throw on bootstrap.

================================================================
DO NOT
================================================================
- DO NOT introduce winston or any second logger.
- DO NOT block the event loop on log writes.
- DO NOT log objects without scrubbing first — emit path runs scrub serializer.
- DO NOT couple this library to NestJS — NestJS adapter is OPTIONAL and lives in a sub-entry.
- DO NOT couple to Next.js — same.
- DO NOT allow scrub disable in production. Throw on startup.
- DO NOT use `any` types.
- DO NOT modify existing CoreMesh controllers or services — only swap their Logger DI.

Start by summarizing your understanding. Then proceed to Phase A.
```

---

## How to use this

1. `cd F:\Web-Projects\MadinatyAI\CoreMesh && claude`.
2. Paste the prompt block above.
3. Wait for summary; verify against `logging.md`.
4. Approve Phase A. Review pure scrub + correlation tests.
5. Proceed phase-by-phase.

**Sequencing note: This library MUST ship before Gateway Core and before Partner API.** Both depend on it.
