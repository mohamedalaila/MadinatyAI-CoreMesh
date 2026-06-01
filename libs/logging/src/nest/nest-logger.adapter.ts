/**
 * NestJS adapter for @madinatyai/logging.
 * Drop-in replacement for the default NestJS Logger so existing
 * `new Logger('Foo').log(...)` calls route through our logger.
 */
import { LoggerService as NestLoggerService, Injectable } from '@nestjs/common';
import { LoggerService, type LoggingConfig } from '../logger.service';

@Injectable()
export class NestLoggerAdapter implements NestLoggerService {
  private readonly logger: LoggerService;
  private context?: string;

  constructor(config: LoggingConfig) {
    this.logger = new LoggerService(config);
  }

  /** Set the NestJS context (e.g. service name). */
  setContext(context: string): void {
    this.context = context;
  }

  log(message: string, context?: string): void {
    this.logger.info(message, { context: context ?? this.context });
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, { context: context ?? this.context, trace });
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, { context: context ?? this.context });
  }

  debug(message: string, context?: string): void {
    this.logger.debug(message, { context: context ?? this.context });
  }

  verbose(message: string, context?: string): void {
    this.logger.trace(message, { context: context ?? this.context });
  }

  /** Get the underlying LoggerService for structured helpers (audit, security, access). */
  get underlying(): LoggerService {
    return this.logger;
  }
}
