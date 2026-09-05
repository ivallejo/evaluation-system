import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConflictException } from '../../domain/exceptions/conflict.exception.js';
import { NotFoundException } from '../../domain/exceptions/not-found.exception.js';
import { ValidationException } from '../../domain/exceptions/validation.exception.js';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request.headers['x-request-id'] as string | undefined;

    let statusCode = 500;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof NotFoundException) {
      statusCode = 404;
      message = exception.message;
      error = 'Not Found';
    } else if (exception instanceof ConflictException) {
      statusCode = 409;
      message = exception.message;
      error = 'Conflict';
    } else if (exception instanceof ValidationException) {
      statusCode = 400;
      message = exception.messages;
      error = 'Bad Request';
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as Record<string, unknown>;
        message = (res['message'] as string | string[]) ?? exception.message;
        error = (res['error'] as string) ?? exception.name;
      } else {
        message = exceptionResponse as string;
        error = exception.name;
      }
    }
    // For 500 errors: log internally but never expose stack trace to the client
    if (statusCode === 500) {
      console.error('[GlobalExceptionFilter] Unhandled exception:', exception);
    }

    response.status(statusCode).json({
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      requestId: requestId ?? null,
    });
  }
}
