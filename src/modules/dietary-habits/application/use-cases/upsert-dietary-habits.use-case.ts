import { randomUUID } from 'crypto';
import { Inject } from '@nestjs/common';
import { DietaryHabits } from '../../domain/entities/dietary-habits.entity.js';
import type { DietaryHabitsRepository } from '../../domain/repositories/dietary-habits.repository.js';
import type { EvaluationRepository } from '../../../evaluation/domain/repositories/evaluation.repository.js';
import { NotFoundException } from '../../../../shared/domain/exceptions/not-found.exception.js';

export interface UpsertDietaryHabitsInput {
  evaluationId: string;
  description: string;
}

export class UpsertDietaryHabitsUseCase {
  constructor(
    @Inject('EvaluationRepository')
    private readonly evaluationRepository: EvaluationRepository,
    @Inject('DietaryHabitsRepository')
    private readonly dietaryHabitsRepository: DietaryHabitsRepository,
  ) {}

  async execute(input: UpsertDietaryHabitsInput): Promise<DietaryHabits> {
    const evaluation = await this.evaluationRepository.findById(
      input.evaluationId,
    );
    if (!evaluation) {
      throw new NotFoundException('Evaluation not found');
    }

    const existing = await this.dietaryHabitsRepository.findByEvaluationId(
      input.evaluationId,
    );

    if (existing) {
      existing.description = input.description;
      existing.updatedAt = new Date();
      return this.dietaryHabitsRepository.update(existing);
    }

    const now = new Date();
    const dietaryHabits = new DietaryHabits(
      randomUUID(),
      input.evaluationId,
      input.description,
      now,
      now,
    );

    return this.dietaryHabitsRepository.save(dietaryHabits);
  }
}
