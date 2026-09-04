import { Inject } from '@nestjs/common';
import { NotFoundException } from '../../../../shared/domain/exceptions/not-found.exception.js';
import { Trainer } from '../../domain/entities/trainer.entity.js';
import type { TrainerRepository } from '../../domain/repositories/trainer.repository.js';

export class GetTrainerUseCase {
  constructor(
    @Inject('TrainerRepository')
    private readonly trainerRepository: TrainerRepository,
  ) {}

  async execute(id: string): Promise<Trainer> {
    const trainer = await this.trainerRepository.findById(id);
    if (!trainer) {
      throw new NotFoundException('Trainer not found');
    }
    return trainer;
  }
}
