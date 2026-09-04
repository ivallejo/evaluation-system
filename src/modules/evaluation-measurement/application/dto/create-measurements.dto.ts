import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { CreateMeasurementItemDto } from './create-measurement-item.dto.js';

export class CreateMeasurementsDto {
  @ApiProperty({
    description: 'Array of measurements to create for this evaluation',
    type: [CreateMeasurementItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMeasurementItemDto)
  measurements: CreateMeasurementItemDto[];
}
