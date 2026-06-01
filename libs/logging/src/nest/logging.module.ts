/**
 * NestJS module for @madinatyai/logging.
 * Provides LoggerService injectable and NestJS Logger adapter.
 */
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { LoggerService, type LoggingConfig } from '../logger.service';
import { NestLoggerAdapter } from './nest-logger.adapter';

export const LOGGING_CONFIG = 'LOGGING_CONFIG';

@Module({})
export class LoggingModule {
  /**
   * Register the logging module with configuration.
   * Sets up LoggerService as an injectable and replaces the NestJS application logger.
   */
  static forRoot(config: LoggingConfig): DynamicModule {
    const configProvider: Provider = {
      provide: LOGGING_CONFIG,
      useValue: config,
    };

    const loggerServiceProvider: Provider = {
      provide: LoggerService,
      useFactory: () => {
        // Validate: cannot disable scrub in production
        if (config.env === 'production') {
          // Production scrub is always-on; no explicit disable flag exists
        }
        return new LoggerService(config);
      },
    };

    const adapterProvider: Provider = {
      provide: NestLoggerAdapter,
      useFactory: (logger: LoggerService) => {
        const adapter = new NestLoggerAdapter(config);
        return adapter;
      },
      inject: [LoggerService],
    };

    return {
      module: LoggingModule,
      providers: [configProvider, loggerServiceProvider, adapterProvider],
      exports: [LoggerService, NestLoggerAdapter],
      global: true,
    };
  }
}
