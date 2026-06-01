import { parseTraceParent, generateTraceParent, resolveCorrelationId } from './traceparent';

describe('traceparent', () => {
  describe('parseTraceParent', () => {
    it('should parse a valid traceparent header', () => {
      const header = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
      const result = parseTraceParent(header);
      expect(result).not.toBeNull();
      expect(result!.version).toBe('00');
      expect(result!.traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736');
      expect(result!.parentId).toBe('00f067aa0ba902b7');
      expect(result!.flags).toBe('01');
      expect(result!.toString()).toBe(header.toLowerCase());
    });

    it('should return null for invalid format', () => {
      expect(parseTraceParent('invalid')).toBeNull();
      expect(parseTraceParent('')).toBeNull();
      expect(parseTraceParent('00-short-short-01')).toBeNull();
    });

    it('should return null for version ff (forbidden)', () => {
      const header = 'ff-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
      expect(parseTraceParent(header)).toBeNull();
    });

    it('should handle uppercase input (case-insensitive)', () => {
      const header = '00-4BF92F3577B34DA6A3CE929D0E0E4736-00F067AA0BA902B7-01';
      const result = parseTraceParent(header);
      expect(result).not.toBeNull();
      expect(result!.version).toBe('00');
    });
  });

  describe('generateTraceParent', () => {
    it('should generate a valid traceparent', () => {
      const tp = generateTraceParent();
      expect(tp.version).toBe('00');
      expect(tp.traceId).toHaveLength(32);
      expect(tp.parentId).toHaveLength(16);
      expect(tp.flags).toBe('01');
      expect(tp.toString()).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
    });

    it('should generate unique trace IDs', () => {
      const a = generateTraceParent();
      const b = generateTraceParent();
      expect(a.traceId).not.toBe(b.traceId);
    });
  });

  describe('resolveCorrelationId', () => {
    it('should prefer traceparent header', () => {
      const headers = {
        traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
        'x-correlation-id': 'legacy-id',
      };
      const result = resolveCorrelationId(headers);
      expect(result.traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736');
    });

    it('should fall back to x-correlation-id if no traceparent', () => {
      const headers = { 'x-correlation-id': 'abc123def' };
      const result = resolveCorrelationId(headers);
      // Legacy ID hex chars embedded into synthetic traceparent traceId
      expect(result.version).toBe('00');
      expect(result.traceId).toContain('abc123def');
    });

    it('should generate a new traceparent if neither header present', () => {
      const result = resolveCorrelationId({});
      expect(result.version).toBe('00');
      expect(result.traceId).toHaveLength(32);
    });

    it('should generate a new traceparent if traceparent is invalid', () => {
      const headers = { traceparent: 'invalid' };
      const result = resolveCorrelationId(headers);
      expect(result.version).toBe('00');
      expect(result.traceId).toHaveLength(32);
    });
  });
});
