import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ProgressRecord } from '../../../../shared/domain/repositories/progress.repository.js';

export class ProgressRecordResponseDto {
  @ApiProperty({ example: '2024-01-15T00:00:00.000Z' })
  evaluationDate: Date;

  @ApiPropertyOptional({ example: 75.5, nullable: true, type: Number })
  weightKg: number | null;

  @ApiPropertyOptional({ example: 18.3, nullable: true, type: Number })
  bodyFatPercentage: number | null;

  @ApiPropertyOptional({ example: 42.1, nullable: true, type: Number })
  muscleMassPercentage: number | null;

  @ApiPropertyOptional({ example: 82.0, nullable: true, type: Number })
  waist: number | null;

  static fromRecord(record: ProgressRecord): ProgressRecordResponseDto {
    const dto = new ProgressRecordResponseDto();
    dto.evaluationDate = record.evaluationDate;
    dto.weightKg = record.weightKg;
    dto.bodyFatPercentage = record.bodyFatPercentage;
    dto.muscleMassPercentage = record.muscleMassPercentage;
    dto.waist = record.waist;
    return dto;
  }
}
