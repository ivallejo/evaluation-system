import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateBodyCompositionDto } from '../../../body-composition/application/dto/create-body-composition.dto.js';
import { CreateMeasurementItemDto } from '../../../evaluation-measurement/application/dto/create-measurement-item.dto.js';

export class CreateDietaryHabitsNestedDto {
  @ApiProperty({
    example: 'Dieta alta en proteínas, baja en carbohidratos. Come 5 veces al día.',
    description: 'Description of dietary habits',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class CreateEvaluationDto {
  @ApiProperty({
    example: '2024-01-15',
    description: 'Date of the evaluation (ISO 8601 date string)',
  })
  @IsDateString()
  evaluationDate: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440002',
    description: 'UUID of the trainer conducting the evaluation',
  })
  @IsOptional()
  @IsUUID()
  trainerId?: string;

  @ApiPropertyOptional({
    example: 'Increase muscle mass',
    description: 'Training objective',
  })
  @IsOptional()
  @IsString()
  objective?: string;

  @ApiPropertyOptional({
    example: 'intermediate',
    description: 'Training level (e.g., beginner, intermediate, advanced)',
  })
  @IsOptional()
  @IsString()
  trainingLevel?: string;

  @ApiPropertyOptional({
    example: 'Left knee surgery in 2022',
    description: 'Description of pre-existing injuries',
  })
  @IsOptional()
  @IsString()
  preExistingInjuries?: string;

  @ApiPropertyOptional({
    example: 'Type 2 diabetes',
    description: 'Important medical diagnoses',
  })
  @IsOptional()
  @IsString()
  importantMedicalDiagnosis?: string;

  @ApiPropertyOptional({
    example: 'No additional comments',
    description: 'Other relevant comments',
  })
  @IsOptional()
  @IsString()
  otherComments?: string;

  @ApiProperty({
    type: CreateBodyCompositionDto,
    description: 'Body composition data for this evaluation',
  })
  @ValidateNested()
  @Type(() => CreateBodyCompositionDto)
  bodyComposition: CreateBodyCompositionDto;

  @ApiProperty({
    type: [CreateMeasurementItemDto],
    description: 'Array of anthropometric measurements',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMeasurementItemDto)
  measurements: CreateMeasurementItemDto[];

  @ApiPropertyOptional({
    type: CreateDietaryHabitsNestedDto,
    description: 'Optional dietary habits for this evaluation',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateDietaryHabitsNestedDto)
  dietaryHabits?: CreateDietaryHabitsNestedDto;
}
