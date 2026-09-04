import { randomUUID } from 'node:crypto';
import { Inject } from '@nestjs/common';
import { ValidationException } from '../../../../shared/domain/exceptions/validation.exception.js';
import { Trainer } from '../../domain/entities/trainer.entity.js';
import type { TrainerRepository } from '../../domain/repositories/trainer.repository.js';

export interface CreateTrainerInput {
  firstName: string;
  lastName: string;
}

export class CreateTrainerUseCase {
  constructor(
    @Inject('TrainerRepository')
    private readonly trainerRepository: TrainerRepository,
  ) {}

  async execute(input: CreateTrainerInput): Promise<Trainer> {
    const errors: string[] = [];
    if (!input.firstName || input.firstName.trim() === '') {
      errors.push('firstName must not be empty');
    }
    if (!input.lastName || input.lastName.trim() === '') {
      errors.push('lastName must not be empty');
    }
    if (errors.length > 0) {
      throw new ValidationException(errors);
    }

    const now = new Date();
    const trainer = new Trainer(
      randomUUID(),
      input.firstName,
      input.lastName,
      true,
      now,
      now,
    );

    return this.trainerRepository.save(trainer);
  }
}
