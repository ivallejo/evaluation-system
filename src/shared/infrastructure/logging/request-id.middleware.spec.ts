import { RequestIdMiddleware } from './request-id.middleware.js';
import type { Request, Response } from 'express';

describe('RequestIdMiddleware', () => {
  let middleware: RequestIdMiddleware;

  // Minimal Express mocks
  function makeReq(headers: Record<string, string> = {}): Request {
    return { headers } as unknown as Request;
  }

  function makeRes(): { headers: Record<string, string>; setHeader: (k: string, v: string) => void } {
    const headers: Record<string, string> = {};
    return {
      headers,
      setHeader(k: string, v: string) {
        headers[k] = v;
      },
    };
  }

  beforeEach(() => {
    middleware = new RequestIdMiddleware();
  });

  it('generates a UUID and sets it on the request header when none is provided', () => {
    const req = makeReq();
    const res = makeRes();
    const next = vi.fn();

    middleware.use(req as unknown as Request, res as unknown as Response, next);

    const id = req.headers['x-request-id'] as string;
    expect(id).toBeDefined();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(res.headers['X-Request-Id']).toBe(id);
    expect(next).toHaveBeenCalledOnce();
  });

  it('propagates an existing X-Request-Id header without generating a new one', () => {
    const existingId = '550e8400-e29b-41d4-a716-446655440000';
    const req = makeReq({ 'x-request-id': existingId });
    const res = makeRes();
    const next = vi.fn();

    middleware.use(req as unknown as Request, res as unknown as Response, next);

    expect(req.headers['x-request-id']).toBe(existingId);
    expect(res.headers['X-Request-Id']).toBe(existingId);
    expect(next).toHaveBeenCalledOnce();
  });

  it('sets the X-Request-Id response header', () => {
    const req = makeReq();
    const res = makeRes();
    const next = vi.fn();

    middleware.use(req as unknown as Request, res as unknown as Response, next);

    expect(res.headers['X-Request-Id']).toBeDefined();
  });

  it('always calls next()', () => {
    const req = makeReq();
    const res = makeRes();
    const next = vi.fn();

    middleware.use(req as unknown as Request, res as unknown as Response, next);

    expect(next).toHaveBeenCalledOnce();
  });
});
