import { Inject } from '@nestjs/common';
import { Person } from '../../domain/entities/person.entity.js';
import type { PersonRepository } from '../../domain/repositories/person.repository.js';
import { NotFoundException } from '../../../../shared/domain/exceptions/not-found.exception.js';
import { ConflictException } from '../../../../shared/domain/exceptions/conflict.exception.js';

export interface UpdatePersonInput {
  firstName?: string;
  lastName?: string;
  documentNumber?: string;
  birthDate?: Date;
  sex?: 'male' | 'female' | 'other';
  childrenCount?: number;
}

export class UpdatePersonUseCase {
  constructor(
    @Inject('PersonRepository')
    private readonly personRepository: PersonRepository,
  ) {}

  async execute(id: string, input: UpdatePersonInput): Promise<Person> {
    const person = await this.personRepository.findById(id);
    if (!person) {
      throw new NotFoundException('Person not found');
    }

    if (input.documentNumber !== undefined) {
      const existing = await this.personRepository.findByDocumentNumber(
        input.documentNumber,
      );
      if (existing && existing.id !== id) {
        throw new ConflictException('documentNumber already exists');
      }
    }

    // Merge only the provided fields
    if (input.firstName !== undefined) {
      person.firstName = input.firstName;
    }
    if (input.lastName !== undefined) {
      person.lastName = input.lastName;
    }
    if (input.documentNumber !== undefined) {
      person.documentNumber = input.documentNumber;
    }
    if (input.birthDate !== undefined) {
      person.birthDate = input.birthDate;
    }
    if (input.sex !== undefined) {
      person.sex = input.sex;
    }
    if (input.childrenCount !== undefined) {
      person.childrenCount = input.childrenCount;
    }

    person.updatedAt = new Date();

    return this.personRepository.update(person);
  }
}
