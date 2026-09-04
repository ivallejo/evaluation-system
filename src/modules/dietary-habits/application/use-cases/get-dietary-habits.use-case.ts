import { Inject } from '@nestjs/common';
import { DietaryHabits } from '../../domain/entities/dietary-habits.entity.js';
import type { DietaryHabitsRepository } from '../../domain/repositories/dietary-habits.repository.js';
import { NotFoundException } from '../../../../shared/domain/exceptions/not-found.exception.js';

export class GetDietaryHabitsUseCase {
  constructor(
    @Inject('DietaryHabitsRepository')
    private readonly dietaryHabitsRepository: DietaryHabitsRepository,
  ) {}

  async execute(evaluationId: string): Promise<DietaryHabits> {
    const dietaryHabits =
      await this.dietaryHabitsRepository.findByEvaluationId(evaluationId);

    if (!dietaryHabits) {
      throw new NotFoundException('DietaryHabits not found');
    }

    return dietaryHabits;
  }
}
