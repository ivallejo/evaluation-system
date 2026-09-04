import { Inject } from '@nestjs/common';
import type { PersonRepository } from '../../../person/domain/repositories/person.repository.js';
import { NotFoundException } from '../../../../shared/domain/exceptions/not-found.exception.js';
import type {
  ProgressRecord,
  ProgressRepository,
} from '../../../../shared/domain/repositories/progress.repository.js';

export class GetProgressUseCase {
  constructor(
    @Inject('PersonRepository')
    private readonly personRepository: PersonRepository,
    @Inject('ProgressRepository')
    private readonly progressRepository: ProgressRepository,
  ) {}

  async execute(personId: string): Promise<ProgressRecord[]> {
    const person = await this.personRepository.findById(personId);
    if (!person) {
      throw new NotFoundException('Person not found');
    }
    return this.progressRepository.findProgressByPersonId(personId);
  }
}
