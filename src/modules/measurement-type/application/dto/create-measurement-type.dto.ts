import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import type { MeasurementCategory } from '../../domain/entities/measurement-type.entity.js';

export class CreateMeasurementTypeDto {
  @ApiProperty({
    example: 'BICEP_RELAXED',
    description: 'Unique code for the measurement type',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: 'Bícep Relajado',
    description: 'Human-readable name for the measurement type',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'cm',
    description: 'Unit of measurement',
  })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiProperty({
    enum: ['superior', 'inferior'],
    example: 'superior',
    description: 'Body region category',
  })
  @IsEnum(['superior', 'inferior'], {
    message: 'category must be one of: superior, inferior',
  })
  category: MeasurementCategory;
}
