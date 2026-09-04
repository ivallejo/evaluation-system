import { Inject } from '@nestjs/common';
import { Person } from '../../domain/entities/person.entity.js';
import type { PersonRepository } from '../../domain/repositories/person.repository.js';

export class ListPersonsUseCase {
  constructor(
    @Inject('PersonRepository')
    private readonly personRepository: PersonRepository,
  ) {}

  async execute(): Promise<Person[]> {
    return this.personRepository.findAll();
  }
}
