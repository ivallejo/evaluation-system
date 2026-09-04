import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Evaluation } from '../../domain/entities/evaluation.entity.js';

export class EvaluationResponseDto {
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

  @ApiPropertyOptional({
    description: 'Body composition data when available',
    nullable: true,
    additionalProperties: true,
  })
  bodyComposition?: object;

  @ApiPropertyOptional({
    description: 'Anthropometric measurements when available',
    type: 'array',
    items: { type: 'object' },
    nullable: true,
  })
  measurements?: object[];

  @ApiPropertyOptional({
    description: 'Dietary habits data when available',
    nullable: true,
    additionalProperties: true,
  })
  dietaryHabits?: object;

  static fromDomain(evaluation: Evaluation): EvaluationResponseDto {
    const dto = new EvaluationResponseDto();
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
    return dto;
  }
}
