import { randomUUID } from 'crypto';
import { Inject } from '@nestjs/common';
import { BodyComposition } from '../../domain/entities/body-composition.entity.js';
import type { BodyCompositionRepository } from '../../domain/repositories/body-composition.repository.js';
import type { EvaluationRepository } from '../../../evaluation/domain/repositories/evaluation.repository.js';
import { NotFoundException } from '../../../../shared/domain/exceptions/not-found.exception.js';
import { ValidationException } from '../../../../shared/domain/exceptions/validation.exception.js';

export interface CreateBodyCompositionInput {
  evaluationId: string;
  weightKg: number;
  heightM: number;
  bmi?: number;
  bodyFatPercentage?: number;
  muscleMassPercentage?: number;
  idealWeightKg?: number;
  idealBmi?: number;
  idealBodyFatPercentage?: number;
}

export class CreateBodyCompositionUseCase {
  constructor(
    @Inject('BodyCompositionRepository')
    private readonly bodyCompositionRepository: BodyCompositionRepository,
    @Inject('EvaluationRepository')
    private readonly evaluationRepository: EvaluationRepository,
  ) {}

  async execute(input: CreateBodyCompositionInput): Promise<BodyComposition> {
    const errors: string[] = [];

    if (input.weightKg <= 0) {
      errors.push('weightKg must be greater than 0');
    }

    if (input.heightM <= 0) {
      errors.push('heightM must be greater than 0');
    }

    if (
      input.bodyFatPercentage !== undefined &&
      (input.bodyFatPercentage < 0 || input.bodyFatPercentage > 100)
    ) {
      errors.push('bodyFatPercentage must be between 0 and 100');
    }

    if (
      input.muscleMassPercentage !== undefined &&
      (input.muscleMassPercentage < 0 || input.muscleMassPercentage > 100)
    ) {
      errors.push('muscleMassPercentage must be between 0 and 100');
    }

    if (errors.length > 0) {
      throw new ValidationException(errors);
    }

    const evaluation = await this.evaluationRepository.findById(input.evaluationId);
    if (!evaluation) {
      throw new NotFoundException('Evaluation not found');
    }

    const now = new Date();
    const bodyComposition = new BodyComposition(
      randomUUID(),
      input.evaluationId,
      input.weightKg,
      input.heightM,
      now,
      now,
      input.bmi,
      input.bodyFatPercentage,
      input.muscleMassPercentage,
      input.idealWeightKg,
      input.idealBmi,
      input.idealBodyFatPercentage,
    );

    return this.bodyCompositionRepository.save(bodyComposition);
  }
}
