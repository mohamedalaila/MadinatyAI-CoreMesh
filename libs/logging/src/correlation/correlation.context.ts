/**
 * AsyncLocalStorage holder for the current correlation context.
 * Every downstream log call inherits the ID automatically — no manual passing.
 */
import { AsyncLocalStorage } from 'async_hooks';
import type { TraceParent } from './traceparent';

export interface CorrelationContext {
  traceParent: TraceParent;
  /** Convenience: the full traceparent string. */
  correlationId: string;
}

const asyncLocalStorage = new AsyncLocalStorage<CorrelationContext>();

/**
 * Run a function within a correlation context.
 * All log calls inside `fn` will inherit the correlation ID.
 */
export function withCorrelation<T>(context: CorrelationContext, fn: () => T): T {
  return asyncLocalStorage.run(context, fn);
}

/**
 * Get the current correlation context (or undefined if none set).
 */
export function getCorrelationContext(): CorrelationContext | undefined {
  return asyncLocalStorage.getStore();
}

/**
 * Get the current correlation ID string (or empty string if none set).
 */
export function getCorrelationId(): string {
  return asyncLocalStorage.getStore()?.correlationId ?? '';
}

export { asyncLocalStorage };
