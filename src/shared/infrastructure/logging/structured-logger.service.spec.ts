import { StructuredLoggerService } from './structured-logger.service.js';

describe('StructuredLoggerService', () => {
  let logger: StructuredLoggerService;
  let writeSpy: ReturnType<typeof vi.spyOn>;
  let capturedLines: string[];

  beforeEach(() => {
    logger = new StructuredLoggerService();
    capturedLines = [];
    writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      capturedLines.push(chunk as string);
      return true;
    });
  });

  afterEach(() => {
    writeSpy.mockRestore();
  });

  function lastEntry(): Record<string, unknown> {
    const last = capturedLines[capturedLines.length - 1];
    return JSON.parse(last) as Record<string, unknown>;
  }

  // ── Basic fields ────────────────────────────────────────────────────────────

  it('emits JSON with required fields: timestamp, level, message', () => {
    logger.log('hello');
    const entry = lastEntry();

    expect(entry.level).toBe('INFO');
    expect(entry.message).toBe('hello');
    expect(typeof entry.timestamp).toBe('string');
    // ISO 8601 check
    expect(new Date(entry.timestamp as string).toISOString()).toBe(entry.timestamp);
  });

  it('sets level to WARN for warn()', () => {
    logger.warn('something odd');
    expect(lastEntry().level).toBe('WARN');
  });

  it('sets level to DEBUG for debug()', () => {
    logger.debug('debugging');
    expect(lastEntry().level).toBe('DEBUG');
  });

  it('sets level to ERROR for error()', () => {
    logger.error('boom');
    expect(lastEntry().level).toBe('ERROR');
  });

  it('sets level to VERBOSE for verbose()', () => {
    logger.verbose('detailed');
    expect(lastEntry().level).toBe('VERBOSE');
  });

  // ── requestId propagation ───────────────────────────────────────────────────

  it('includes requestId when passed in a metadata object', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    logger.log('test message', { requestId: id });
    expect(lastEntry().requestId).toBe(id);
  });

  // ── ERROR level extras ──────────────────────────────────────────────────────

  it('includes statusCode in ERROR logs from metadata object', () => {
    logger.error('failure', { statusCode: 500, stack: 'Error\n    at fn (file.ts:1:1)' });
    const entry = lastEntry();
    expect(entry.statusCode).toBe(500);
    expect(typeof entry.stack).toBe('string');
  });

  it('includes stack from second string param (NestJS convention)', () => {
    const stack = 'Error: boom\n    at fn (file.ts:1:1)';
    logger.error('boom', stack, 'SomeService');
    const entry = lastEntry();
    expect(entry.stack).toBeDefined();
    expect(entry.context).toBe('SomeService');
  });

  // ── Sensitive data redaction ────────────────────────────────────────────────

  it('redacts password field from metadata object', () => {
    logger.log('user action', { requestId: 'abc', password: 'super-secret' });
    const entry = lastEntry();
    expect(entry.password).toBe('[REDACTED]');
  });

  it('redacts token field from metadata object', () => {
    logger.log('auth', { token: 'jwt-value' });
    expect(lastEntry().token).toBe('[REDACTED]');
  });

  it('redacts accessToken field from metadata object', () => {
    logger.log('auth', { accessToken: 'bearer-123' });
    expect(lastEntry().accessToken).toBe('[REDACTED]');
  });

  it('does not redact non-sensitive fields', () => {
    logger.log('info', { requestId: 'req-1', method: 'POST', path: '/persons' });
    const entry = lastEntry();
    expect(entry.method).toBe('POST');
    expect(entry.path).toBe('/persons');
  });

  it('redacts lines containing sensitive keywords in stack traces', () => {
    const stack = 'Error\n    at password check (auth.ts:10:5)\n    at handler (main.ts:5:1)';
    logger.error('login failed', { stack });
    const entry = lastEntry();
    expect(entry.stack).toContain('[REDACTED LINE]');
    // The clean line should still be present
    expect(entry.stack).toContain('at handler (main.ts:5:1)');
  });

  // ── Output format ───────────────────────────────────────────────────────────

  it('writes each log as a single JSON line terminated with \\n', () => {
    logger.log('line check');
    const raw = capturedLines[capturedLines.length - 1];
    expect(raw.endsWith('\n')).toBe(true);
    // Should parse as valid JSON (newline stripped)
    expect(() => JSON.parse(raw)).not.toThrow();
  });
});
