import { withCorrelation, getCorrelationContext, getCorrelationId } from './correlation.context';
import { generateTraceParent } from './traceparent';

describe('CorrelationContext', () => {
  it('should return undefined outside a correlation context', () => {
    expect(getCorrelationContext()).toBeUndefined();
    expect(getCorrelationId()).toBe('');
  });

  it('should provide context inside withCorrelation', () => {
    const tp = generateTraceParent();
    const context = { traceParent: tp, correlationId: tp.toString() };

    const result = withCorrelation(context, () => {
      const ctx = getCorrelationContext();
      expect(ctx).toBeDefined();
      expect(ctx!.correlationId).toBe(tp.toString());
      return 'done';
    });

    expect(result).toBe('done');
  });

  it('should restore context after withCorrelation completes', () => {
    const tp = generateTraceParent();
    withCorrelation({ traceParent: tp, correlationId: tp.toString() }, () => {
      // context is set inside
    });
    // context is cleared outside
    expect(getCorrelationContext()).toBeUndefined();
  });

  it('should support nested correlation contexts', () => {
    const outer = { traceParent: generateTraceParent(), correlationId: '' };
    outer.correlationId = outer.traceParent.toString();

    const inner = { traceParent: generateTraceParent(), correlationId: '' };
    inner.correlationId = inner.traceParent.toString();

    withCorrelation(outer, () => {
      expect(getCorrelationId()).toBe(outer.correlationId);

      withCorrelation(inner, () => {
        expect(getCorrelationId()).toBe(inner.correlationId);
      });

      expect(getCorrelationId()).toBe(outer.correlationId);
    });
  });
});
