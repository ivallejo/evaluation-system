import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsUUID } from 'class-validator';

export class CreateMeasurementItemDto {
  @ApiProperty({
    description: 'UUID of the measurement type',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  measurementTypeId: string;

  @ApiProperty({
    description: 'Measurement value in the unit defined by the measurement type',
    example: 32.5,
  })
  @IsNumber()
  @IsPositive()
  value: number;
}
