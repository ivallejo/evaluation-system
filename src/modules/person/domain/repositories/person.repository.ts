import { Person } from '../entities/person.entity.js';

export interface PersonRepository {
  findById(id: string): Promise<Person | null>;
  findByDocumentNumber(documentNumber: string): Promise<Person | null>;
  findAll(): Promise<Person[]>;
  save(person: Person): Promise<Person>;
  update(person: Person): Promise<Person>;
}
