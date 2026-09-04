import { Inject } from '@nestjs/common';
import { Evaluation } from '../../domain/entities/evaluation.entity.js';
import type { EvaluationRepository } from '../../domain/repositories/evaluation.repository.js';
import type { PersonRepository } from '../../../person/domain/repositories/person.repository.js';
import { NotFoundException } from '../../../../shared/domain/exceptions/not-found.exception.js';

export class ListPersonEvaluationsUseCase {
  constructor(
    @Inject('PersonRepository')
    private readonly personRepository: PersonRepository,
    @Inject('EvaluationRepository')
    private readonly evaluationRepository: EvaluationRepository,
  ) {}

  async execute(personId: string): Promise<Evaluation[]> {
    const person = await this.personRepository.findById(personId);
    if (!person) {
      throw new NotFoundException('Person not found');
    }
    return this.evaluationRepository.findByPersonId(personId);
  }
}
