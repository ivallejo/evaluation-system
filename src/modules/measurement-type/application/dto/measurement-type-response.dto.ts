import { ApiProperty } from '@nestjs/swagger';
import type {
  MeasurementCategory,
  MeasurementType,
} from '../../domain/entities/measurement-type.entity.js';

export class MeasurementTypeResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'BICEP_RELAXED' })
  code: string;

  @ApiProperty({ example: 'Bícep Relajado' })
  name: string;

  @ApiProperty({ example: 'cm' })
  unit: string;

  @ApiProperty({ enum: ['superior', 'inferior'], example: 'superior' })
  category: MeasurementCategory;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;

  static fromDomain(mt: MeasurementType): MeasurementTypeResponseDto {
    const dto = new MeasurementTypeResponseDto();
    dto.id = mt.id;
    dto.code = mt.code;
    dto.name = mt.name;
    dto.unit = mt.unit;
    dto.category = mt.category;
    dto.active = mt.active;
    dto.createdAt = mt.createdAt;
    dto.updatedAt = mt.updatedAt;
    return dto;
  }
}
