import { Inject } from '@nestjs/common';
import { Evaluation } from '../../domain/entities/evaluation.entity.js';
import type { EvaluationRepository } from '../../domain/repositories/evaluation.repository.js';
import { NotFoundException } from '../../../../shared/domain/exceptions/not-found.exception.js';

export class GetEvaluationUseCase {
  constructor(
    @Inject('EvaluationRepository')
    private readonly evaluationRepository: EvaluationRepository,
  ) {}

  async execute(id: string): Promise<Evaluation> {
    const evaluation = await this.evaluationRepository.findById(id);
    if (!evaluation) {
      throw new NotFoundException('Evaluation not found');
    }
    return evaluation;
  }
}
