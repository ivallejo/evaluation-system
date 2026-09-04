import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { StructuredLoggerService } from '../../infrastructure/logging/structured-logger.service.js';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  constructor(private readonly logger: StructuredLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const requestId = request.headers['x-request-id'] as string | undefined;

    // Ensure X-Request-Id is present in the response headers
    response.setHeader('X-Request-Id', requestId ?? '');

    return next.handle().pipe(
      tap(() => {
        const statusCode = response.statusCode;
        this.logger.log(`HTTP ${request.method} ${request.url} ${statusCode}`, {
          requestId,
          method: request.method,
          path: request.url,
          statusCode,
        });
      }),
    );
  }
}
