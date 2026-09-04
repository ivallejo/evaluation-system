import { Inject } from '@nestjs/common';
import { BodyComposition } from '../../domain/entities/body-composition.entity.js';
import type { BodyCompositionRepository } from '../../domain/repositories/body-composition.repository.js';
import type { EvaluationRepository } from '../../../evaluation/domain/repositories/evaluation.repository.js';
import { NotFoundException } from '../../../../shared/domain/exceptions/not-found.exception.js';

export class GetBodyCompositionUseCase {
  constructor(
    @Inject('BodyCompositionRepository')
    private readonly bodyCompositionRepository: BodyCompositionRepository,
    @Inject('EvaluationRepository')
    private readonly evaluationRepository: EvaluationRepository,
  ) {}

  async execute(evaluationId: string): Promise<BodyComposition> {
    const evaluation = await this.evaluationRepository.findById(evaluationId);
    if (!evaluation) {
      throw new NotFoundException('Evaluation not found');
    }

    const bodyComposition =
      await this.bodyCompositionRepository.findByEvaluationId(evaluationId);
    if (!bodyComposition) {
      throw new NotFoundException('Body composition not found for this evaluation');
    }

    return bodyComposition;
  }
}
