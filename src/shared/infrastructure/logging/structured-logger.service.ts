import { Injectable, LoggerService, LogLevel } from '@nestjs/common';

/** Fields that must never appear in logs (all lowercase for case-insensitive matching). */
const SENSITIVE_KEYS = new Set([
  'password',
  'pass',
  'passwd',
  'secret',
  'token',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'authorization',
  'apikey',
  'api_key',
  'creditcard',
  'credit_card',
  'ssn',
  'cpf',
  'dni',
]);

/**
 * Recursively strips sensitive keys from a plain object so they are never
 * emitted to the log output.
 */
function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 10 || value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item, depth + 1));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    sanitized[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? '[REDACTED]' : sanitize(val, depth + 1);
  }
  return sanitized;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  requestId?: string;
  context?: string;
  statusCode?: number;
  stack?: string;
  [key: string]: unknown;
}

@Injectable()
export class StructuredLoggerService implements LoggerService {
  private readonly logLevels: LogLevel[] = ['log', 'error', 'warn', 'debug', 'verbose'];

  setLogLevels(levels: LogLevel[]): void {
    this.logLevels.splice(0, this.logLevels.length, ...levels);
  }

  /**
   * INFO-level log. Accepts an optional context string as second argument
   * or an object with extra fields (e.g. { requestId }).
   */
  log(message: unknown, ...optionalParams: unknown[]): void {
    this.write('INFO', message, optionalParams);
  }

  /** ERROR-level log. Includes statusCode and stack when provided. */
  error(message: unknown, ...optionalParams: unknown[]): void {
    this.write('ERROR', message, optionalParams);
  }

  /** WARN-level log. */
  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.write('WARN', message, optionalParams);
  }

  /** DEBUG-level log. */
  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.write('DEBUG', message, optionalParams);
  }

  /** VERBOSE-level log. */
  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.write('VERBOSE', message, optionalParams);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private write(level: string, message: unknown, optionalParams: unknown[]): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: this.toMessage(message),
    };

    // NestJS passes the context string (class name) as the last optional param
    // when using the built-in logger. We extract it here when it is a plain string.
    const [firstParam, ...rest] = optionalParams;

    if (typeof firstParam === 'string') {
      // NestJS convention: Logger.error(message, stack, context)
      if (level === 'ERROR') {
        entry.stack = this.sanitizeStack(firstParam);
        if (typeof rest[0] === 'string') {
          entry.context = rest[0];
        }
      } else {
        entry.context = firstParam;
      }
    } else if (firstParam !== undefined && firstParam !== null && typeof firstParam === 'object') {
      // Caller passed a metadata object: { requestId, statusCode, stack, ... }
      const meta = sanitize(firstParam) as Record<string, unknown>;
      if (meta['requestId'] !== undefined) entry.requestId = meta['requestId'] as string;
      if (meta['statusCode'] !== undefined) entry.statusCode = meta['statusCode'] as number;
      if (meta['stack'] !== undefined) entry.stack = this.sanitizeStack(meta['stack'] as string);
      if (meta['context'] !== undefined) entry.context = meta['context'] as string;

      // Merge any remaining extra fields (already sanitized)
      for (const [k, v] of Object.entries(meta)) {
        if (!['requestId', 'statusCode', 'stack', 'context'].includes(k)) {
          entry[k] = v;
        }
      }
    }

    process.stdout.write(JSON.stringify(entry) + '\n');
  }

  private toMessage(value: unknown): string {
    if (typeof value === 'string') return value;
    if (value instanceof Error) return value.message;
    return JSON.stringify(value);
  }

  /**
   * Strips any line in a stack trace that contains sensitive patterns such as
   * passwords or tokens embedded in query strings / URLs.
   */
  private sanitizeStack(stack: string): string {
    if (!stack) return stack;
    return stack
      .split('\n')
      .map((line) => {
        const lower = line.toLowerCase();
        for (const key of SENSITIVE_KEYS) {
          if (lower.includes(key)) return '    [REDACTED LINE]';
        }
        return line;
      })
      .join('\n');
  }
}
