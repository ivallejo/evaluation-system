import { Inject } from '@nestjs/common';
import { EvaluationMeasurement } from '../../domain/entities/evaluation-measurement.entity.js';
import type { EvaluationMeasurementRepository } from '../../domain/repositories/evaluation-measurement.repository.js';
import type { EvaluationRepository } from '../../../evaluation/domain/repositories/evaluation.repository.js';
import { NotFoundException } from '../../../../shared/domain/exceptions/not-found.exception.js';

export class GetMeasurementsUseCase {
  constructor(
    @Inject('EvaluationRepository')
    private readonly evaluationRepository: EvaluationRepository,
    @Inject('EvaluationMeasurementRepository')
    private readonly evaluationMeasurementRepository: EvaluationMeasurementRepository,
  ) {}

  async execute(evaluationId: string): Promise<EvaluationMeasurement[]> {
    // Verify evaluation exists
    const evaluation = await this.evaluationRepository.findById(evaluationId);
    if (!evaluation) {
      throw new NotFoundException('Evaluation not found');
    }

    return this.evaluationMeasurementRepository.findByEvaluationId(evaluationId);
  }
}
