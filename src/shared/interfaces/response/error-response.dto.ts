import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 404, description: 'HTTP status code' })
  statusCode: number;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: 'Resource not found',
    description: 'Error message or array of validation messages',
  })
  message: string | string[];

  @ApiProperty({ example: 'Not Found', description: 'Short error label' })
  error: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'ISO 8601 timestamp of when the error occurred',
  })
  timestamp: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique request identifier propagated from X-Request-Id header',
  })
  requestId: string;
}
