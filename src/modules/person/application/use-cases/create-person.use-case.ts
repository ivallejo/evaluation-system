import { randomUUID } from 'crypto';
import { Inject } from '@nestjs/common';
import { Person } from '../../domain/entities/person.entity.js';
import type { PersonRepository } from '../../domain/repositories/person.repository.js';
import { ConflictException } from '../../../../shared/domain/exceptions/conflict.exception.js';
import { ValidationException } from '../../../../shared/domain/exceptions/validation.exception.js';

export interface CreatePersonInput {
  firstName: string;
  lastName: string;
  documentNumber?: string;
  birthDate?: Date;
  sex?: 'male' | 'female' | 'other';
  childrenCount?: number;
}

export class CreatePersonUseCase {
  constructor(
    @Inject('PersonRepository')
    private readonly personRepository: PersonRepository,
  ) {}

  async execute(input: CreatePersonInput): Promise<Person> {
    if (input.documentNumber) {
      const existing = await this.personRepository.findByDocumentNumber(
        input.documentNumber,
      );
      if (existing) {
        throw new ConflictException('documentNumber already exists');
      }
    }

    if (input.childrenCount !== undefined && input.childrenCount < 0) {
      throw new ValidationException(['childrenCount must be >= 0']);
    }

    const now = new Date();
    const person = new Person(
      randomUUID(),
      input.firstName,
      input.lastName,
      now,
      now,
      input.documentNumber,
      input.birthDate,
      input.sex,
      input.childrenCount,
    );

    return this.personRepository.save(person);
  }
}
