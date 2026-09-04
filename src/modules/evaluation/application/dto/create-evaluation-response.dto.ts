import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BodyCompositionResponseDto } from '../../../body-composition/application/dto/body-composition-response.dto.js';
import { EvaluationMeasurementResponseDto } from '../../../evaluation-measurement/application/dto/evaluation-measurement-response.dto.js';
import { DietaryHabitsResponseDto } from '../../../dietary-habits/application/dto/dietary-habits-response.dto.js';
import type { EvaluationResult } from '../use-cases/create-evaluation.use-case.js';

export class CreateEvaluationResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  personId: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440002' })
  trainerId?: string;

  @ApiProperty({ example: '2024-01-15' })
  evaluationDate: Date;

  @ApiPropertyOptional({ example: 'Increase muscle mass' })
  objective?: string;

  @ApiPropertyOptional({ example: 'intermediate' })
  trainingLevel?: string;

  @ApiPropertyOptional({ example: 'Left knee surgery in 2022' })
  preExistingInjuries?: string;

  @ApiPropertyOptional({ example: 'Type 2 diabetes' })
  importantMedicalDiagnosis?: string;

  @ApiPropertyOptional({ example: 'No additional comments' })
  otherComments?: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;

  @ApiProperty({
    type: BodyCompositionResponseDto,
    description: 'Body composition data',
  })
  bodyComposition: BodyCompositionResponseDto;

  @ApiProperty({
    type: [EvaluationMeasurementResponseDto],
    description: 'List of anthropometric measurements',
  })
  measurements: EvaluationMeasurementResponseDto[];

  @ApiPropertyOptional({
    type: DietaryHabitsResponseDto,
    nullable: true,
    description: 'Dietary habits data, null if not provided',
  })
  dietaryHabits: DietaryHabitsResponseDto | null;

  static fromResult(result: EvaluationResult): CreateEvaluationResponseDto {
    const dto = new CreateEvaluationResponseDto();
    const { evaluation, bodyComposition, measurements, dietaryHabits } = result;

    dto.id = evaluation.id;
    dto.personId = evaluation.personId;
    dto.trainerId = evaluation.trainerId;
    dto.evaluationDate = evaluation.evaluationDate;
    dto.objective = evaluation.objective;
    dto.trainingLevel = evaluation.trainingLevel;
    dto.preExistingInjuries = evaluation.preExistingInjuries;
    dto.importantMedicalDiagnosis = evaluation.importantMedicalDiagnosis;
    dto.otherComments = evaluation.otherComments;
    dto.createdAt = evaluation.createdAt;
    dto.updatedAt = evaluation.updatedAt;

    dto.bodyComposition = BodyCompositionResponseDto.fromDomain(bodyComposition);
    dto.measurements = measurements.map(EvaluationMeasurementResponseDto.fromDomain);
    dto.dietaryHabits = dietaryHabits
      ? DietaryHabitsResponseDto.fromDomain(dietaryHabits)
      : null;

    return dto;
  }
}
