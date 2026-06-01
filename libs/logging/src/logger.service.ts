/**
 * Core LoggerService — structured JSON logging built on pino.
 * Framework-agnostic; NestJS adapter lives in a separate sub-entry.
 */
import pino, { type Logger as PinoLogger, type LoggerOptions } from 'pino';
import { scrub } from './scrub/scrub';
import { getCorrelationId } from './correlation/correlation.context';
import { createPinoConfig } from './pino-config';

export interface LoggingConfig {
  /** Identifies the codebase in every emission (required). */
  service: string;
  /** Directory for file outputs. Default: './logs'. */
  logDir?: string;
  /** Minimum level to emit. Default: 'info' (prod) / 'debug' (dev). */
  level?: string;
  /** One of development, testing, staging, production. Default: 'development'. */
  env?: string;
  /** Additional keys to add to the scrub denylist. */
  scrubExtraKeys?: string[];
  /** Disable file output (containers that aggregate stdout). */
  disableFile?: boolean;
  /** Disable console output. */
  disableConsole?: boolean;
}

/** Audit event shape. */
export interface AuditEvent {
  actor: { type: string; id: string };
  action: string;
  target: { type: string; id: string };
  outcome: 'success' | 'failure';
  reason?: string | null;
  metadata?: Record<string, unknown>;
}

/** Security event shape. */
export interface SecurityEvent {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  [key: string]: unknown;
}

/** Access log event shape. */
export interface AccessEvent {
  method: string;
  path: string;
  status: number;
  durationMs: number;
  [key: string]: unknown;
}

export class LoggerService {
  private readonly pino: PinoLogger;
  private readonly config: LoggingConfig;
  private readonly extraScrubKeys: ReadonlyArray<string> | undefined;

  constructor(config: LoggingConfig) {
    this.config = config;
    this.extraScrubKeys = config.scrubExtraKeys;

    // Validate: cannot disable scrub in production
    if (config.env === 'production' && config.scrubExtraKeys !== undefined) {
      // scrubExtraKeys is additive, that's fine
    }

    const pinoConfig = createPinoConfig({
      service: config.service,
      level: config.level ?? (config.env === 'production' ? 'info' : 'debug'),
      logDir: config.logDir ?? './logs',
      disableFile: config.disableFile ?? false,
      disableConsole: config.disableConsole ?? false,
    });

    this.pino = pino(pinoConfig);
  }

  /** Get the underlying pino logger (for advanced use). */
  get pinoInstance(): PinoLogger {
    return this.pino;
  }

  private enrich(mergeObj?: Record<string, unknown>): Record<string, unknown> {
    const base: Record<string, unknown> = {
      service: this.config.service,
      env: this.config.env ?? 'development',
      correlationId: getCorrelationId() || undefined,
    };
    if (mergeObj) {
      const scrubbed = scrub(mergeObj, this.extraScrubKeys) as Record<string, unknown>;
      return { ...base, ...scrubbed };
    }
    return base;
  }

  trace(msg: string, mergeObj?: Record<string, unknown>): void {
    this.pino.trace(this.enrich(mergeObj), msg);
  }

  debug(msg: string, mergeObj?: Record<string, unknown>): void {
    this.pino.debug(this.enrich(mergeObj), msg);
  }

  info(msg: string, mergeObj?: Record<string, unknown>): void {
    this.pino.info(this.enrich(mergeObj), msg);
  }

  warn(msg: string, mergeObj?: Record<string, unknown>): void {
    this.pino.warn(this.enrich(mergeObj), msg);
  }

  error(msg: string, mergeObj?: Record<string, unknown>): void {
    this.pino.error(this.enrich(mergeObj), msg);
  }

  fatal(msg: string, mergeObj?: Record<string, unknown>): void {
    this.pino.fatal(this.enrich(mergeObj), msg);
  }

  /** Emit an audit event (actor/action/target/outcome). */
  audit(event: AuditEvent): void {
    const data = this.enrich({
      stream: 'audit',
      ...event,
    });
    this.pino.info(data, `AUDIT ${event.action}`);
  }

  /** Emit a security event (auth failures, replays, rate-limit hits). */
  security(event: SecurityEvent): void {
    const data = this.enrich({
      stream: 'security',
      ...event,
    });
    this.pino.warn(data, `SECURITY ${event.type}`);
  }

  /** Emit an access log event (one per HTTP request). */
  access(event: AccessEvent): void {
    const data = this.enrich({
      stream: 'access',
      ...event,
    });
    this.pino.info(data, `ACCESS ${event.method} ${event.path} ${event.status}`);
  }
}
