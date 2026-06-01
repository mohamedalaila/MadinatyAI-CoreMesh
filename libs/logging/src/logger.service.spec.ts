import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  let logger: LoggerService;

  beforeEach(() => {
    logger = new LoggerService({
      service: 'test',
      env: 'testing',
      level: 'debug',
      disableFile: true,
      disableConsole: true,
    });
  });

  it('should be created', () => {
    expect(logger).toBeDefined();
  });

  it('should expose the underlying pino instance', () => {
    expect(logger.pinoInstance).toBeDefined();
  });

  describe('structured helpers', () => {
    it('audit should emit with stream:audit tag', () => {
      const spy = jest.spyOn(logger.pinoInstance, 'info').mockImplementation();
      logger.audit({
        actor: { type: 'user', id: 'u1' },
        action: 'TEST_ACTION',
        target: { type: 'resource', id: 'r1' },
        outcome: 'success',
      });
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ stream: 'audit', action: 'TEST_ACTION' }),
        expect.any(String),
      );
      spy.mockRestore();
    });

    it('security should emit with stream:security tag', () => {
      const spy = jest.spyOn(logger.pinoInstance, 'warn').mockImplementation();
      logger.security({
        severity: 'medium',
        type: 'TEST_EVENT',
      });
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ stream: 'security', type: 'TEST_EVENT' }),
        expect.any(String),
      );
      spy.mockRestore();
    });

    it('access should emit with stream:access tag', () => {
      const spy = jest.spyOn(logger.pinoInstance, 'info').mockImplementation();
      logger.access({
        method: 'GET',
        path: '/api/v1/test',
        status: 200,
        durationMs: 42,
      });
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ stream: 'access', method: 'GET', status: 200 }),
        expect.any(String),
      );
      spy.mockRestore();
    });
  });

  describe('scrub integration', () => {
    it('should scrub sensitive fields in log output', () => {
      const spy = jest.spyOn(logger.pinoInstance, 'info').mockImplementation();
      logger.info('test', { password: 'secret', username: 'alice' });
      const callArgs = spy.mock.calls[0][0] as unknown as Record<string, unknown>;
      expect(callArgs.password).toBe('[REDACTED]');
      expect(callArgs.username).toBe('alice');
      spy.mockRestore();
    });

    it('should scrub extra keys when configured', () => {
      const customLogger = new LoggerService({
        service: 'test',
        env: 'testing',
        level: 'debug',
        disableFile: true,
        disableConsole: true,
        scrubExtraKeys: ['myCustomSecret'],
      });
      const spy = jest.spyOn(customLogger.pinoInstance, 'info').mockImplementation();
      customLogger.info('test', { myCustomSecret: 'shh', safe: 'ok' });
      const callArgs = spy.mock.calls[0][0] as unknown as Record<string, unknown>;
      expect(callArgs.myCustomSecret).toBe('[REDACTED]');
      expect(callArgs.safe).toBe('ok');
      spy.mockRestore();
    });
  });
});
