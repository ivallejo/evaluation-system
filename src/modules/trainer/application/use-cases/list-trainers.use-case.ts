import { Inject } from '@nestjs/common';
import { Trainer } from '../../domain/entities/trainer.entity.js';
import type { TrainerRepository } from '../../domain/repositories/trainer.repository.js';

export class ListTrainersUseCase {
  constructor(
    @Inject('TrainerRepository')
    private readonly trainerRepository: TrainerRepository,
  ) {}

  async execute(): Promise<Trainer[]> {
    return this.trainerRepository.findAll();
  }
}
