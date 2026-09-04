import { Inject } from '@nestjs/common';
import { Person } from '../../domain/entities/person.entity.js';
import type { PersonRepository } from '../../domain/repositories/person.repository.js';
import { NotFoundException } from '../../../../shared/domain/exceptions/not-found.exception.js';

export class GetPersonUseCase {
  constructor(
    @Inject('PersonRepository')
    private readonly personRepository: PersonRepository,
  ) {}

  async execute(id: string): Promise<Person> {
    const person = await this.personRepository.findById(id);
    if (!person) {
      throw new NotFoundException('Person not found');
    }
    return person;
  }
}
