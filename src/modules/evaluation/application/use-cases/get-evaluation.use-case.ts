import { Inject } from '@nestjs/common';
import type { BodyComposition } from '../../../body-composition/domain/entities/body-composition.entity.js';
import type { BodyCompositionRepository } from '../../../body-composition/domain/repositories/body-composition.repository.js';
import type { DietaryHabits } from '../../../dietary-habits/domain/entities/dietary-habits.entity.js';
import type { DietaryHabitsRepository } from '../../../dietary-habits/domain/repositories/dietary-habits.repository.js';
import type { EvaluationMeasurement } from '../../../evaluation-measurement/domain/entities/evaluation-measurement.entity.js';
import type { EvaluationMeasurementRepository } from '../../../evaluation-measurement/domain/repositories/evaluation-measurement.repository.js';
import { NotFoundException } from '../../../../shared/domain/exceptions/not-found.exception.js';
import { Evaluation } from '../../domain/entities/evaluation.entity.js';
import type { EvaluationRepository } from '../../domain/repositories/evaluation.repository.js';

export interface GetEvaluationResult {
  evaluation: Evaluation;
  bodyComposition: BodyComposition | null;
  measurements: EvaluationMeasurement[];
  dietaryHabits: DietaryHabits | null;
}

export class GetEvaluationUseCase {
  constructor(
    @Inject('EvaluationRepository')
    private readonly evaluationRepository: EvaluationRepository,
    @Inject('BodyCompositionRepository')
    private readonly bodyCompositionRepository: BodyCompositionRepository,
    @Inject('EvaluationMeasurementRepository')
    private readonly measurementRepository: EvaluationMeasurementRepository,
    @Inject('DietaryHabitsRepository')
    private readonly dietaryHabitsRepository: DietaryHabitsRepository,
  ) {}

  async execute(id: string): Promise<GetEvaluationResult> {
    const evaluation = await this.evaluationRepository.findById(id);
    if (!evaluation) {
      throw new NotFoundException('Evaluation not found');
    }

    const [bodyComposition, measurements, dietaryHabits] = await Promise.all([
      this.bodyCompositionRepository.findByEvaluationId(id),
      this.measurementRepository.findByEvaluationId(id),
      this.dietaryHabitsRepository.findByEvaluationId(id),
    ]);

    return { evaluation, bodyComposition, measurements, dietaryHabits };
  }
}
