import { Controller, Get, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { DataSource } from 'typeorm';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'API and database are operational',
    schema: {
      example: { status: 'ok', database: 'connected' },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Database is unavailable',
    schema: {
      example: { status: 'error', database: 'disconnected' },
    },
  })
  async check(@Res() res: Response): Promise<void> {
    try {
      await this.dataSource.query('SELECT 1');
      res.status(200).json({ status: 'ok', database: 'connected' });
    } catch {
      res.status(503).json({ status: 'error', database: 'disconnected' });
    }
  }
}
