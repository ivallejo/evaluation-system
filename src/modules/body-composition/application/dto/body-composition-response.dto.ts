import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BodyComposition } from '../../domain/entities/body-composition.entity.js';

export class BodyCompositionResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  evaluationId: string;

  @ApiProperty({ example: 75.5, description: 'Weight in kilograms' })
  weightKg: number;

  @ApiProperty({ example: 1.75, description: 'Height in meters' })
  heightM: number;

  @ApiPropertyOptional({ example: 24.7, description: 'Body Mass Index' })
  bmi?: number;

  @ApiPropertyOptional({ example: 18.5, description: 'Body fat percentage (0–100)' })
  bodyFatPercentage?: number;

  @ApiPropertyOptional({ example: 42.0, description: 'Muscle mass percentage (0–100)' })
  muscleMassPercentage?: number;

  @ApiPropertyOptional({ example: 70.0, description: 'Ideal weight in kilograms' })
  idealWeightKg?: number;

  @ApiPropertyOptional({ example: 22.0, description: 'Ideal Body Mass Index' })
  idealBmi?: number;

  @ApiPropertyOptional({ example: 15.0, description: 'Ideal body fat percentage (0–100)' })
  idealBodyFatPercentage?: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;

  static fromDomain(bc: BodyComposition): BodyCompositionResponseDto {
    const dto = new BodyCompositionResponseDto();
    dto.id = bc.id;
    dto.evaluationId = bc.evaluationId;
    dto.weightKg = bc.weightKg;
    dto.heightM = bc.heightM;
    dto.bmi = bc.bmi;
    dto.bodyFatPercentage = bc.bodyFatPercentage;
    dto.muscleMassPercentage = bc.muscleMassPercentage;
    dto.idealWeightKg = bc.idealWeightKg;
    dto.idealBmi = bc.idealBmi;
    dto.idealBodyFatPercentage = bc.idealBodyFatPercentage;
    dto.createdAt = bc.createdAt;
    dto.updatedAt = bc.updatedAt;
    return dto;
  }
}
