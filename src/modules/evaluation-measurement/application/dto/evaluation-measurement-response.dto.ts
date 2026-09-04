import { ApiProperty } from '@nestjs/swagger';
import { EvaluationMeasurement } from '../../domain/entities/evaluation-measurement.entity.js';

export class EvaluationMeasurementResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  evaluationId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  measurementTypeId: string;

  @ApiProperty({ example: 32.5 })
  value: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;

  static fromDomain(
    measurement: EvaluationMeasurement,
  ): EvaluationMeasurementResponseDto {
    const dto = new EvaluationMeasurementResponseDto();
    dto.id = measurement.id;
    dto.evaluationId = measurement.evaluationId;
    dto.measurementTypeId = measurement.measurementTypeId;
    dto.value = measurement.value;
    dto.createdAt = measurement.createdAt;
    dto.updatedAt = measurement.updatedAt;
    return dto;
  }
}
