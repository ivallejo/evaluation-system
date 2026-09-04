import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Person } from '../../domain/entities/person.entity.js';
import type { PersonRepository } from '../../domain/repositories/person.repository.js';
import { PersonOrmEntity } from '../persistence/person.orm-entity.js';

@Injectable()
export class PersonTypeOrmRepository implements PersonRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findById(id: string): Promise<Person | null> {
    const orm = await this.dataSource
      .getRepository(PersonOrmEntity)
      .findOne({ where: { id } });
    return orm ? this.toDomain(orm) : null;
  }

  async findByDocumentNumber(documentNumber: string): Promise<Person | null> {
    const orm = await this.dataSource
      .getRepository(PersonOrmEntity)
      .findOne({ where: { documentNumber } });
    return orm ? this.toDomain(orm) : null;
  }

  async findAll(): Promise<Person[]> {
    const orms = await this.dataSource.getRepository(PersonOrmEntity).find();
    return orms.map((o) => this.toDomain(o));
  }

  async save(person: Person): Promise<Person> {
    const repo = this.dataSource.getRepository(PersonOrmEntity);
    const orm = repo.create(this.toOrm(person));
    const saved = await repo.save(orm);
    return this.toDomain(saved);
  }

  async update(person: Person): Promise<Person> {
    const repo = this.dataSource.getRepository(PersonOrmEntity);
    await repo.save(this.toOrm(person));
    const updated = await repo.findOneOrFail({ where: { id: person.id } });
    return this.toDomain(updated);
  }

  private toDomain(orm: PersonOrmEntity): Person {
    return new Person(
      orm.id,
      orm.firstName,
      orm.lastName,
      orm.createdAt,
      orm.updatedAt,
      orm.documentNumber,
      orm.birthDate,
      orm.sex as 'male' | 'female' | 'other' | undefined,
      orm.childrenCount,
    );
  }

  private toOrm(person: Person): PersonOrmEntity {
    const orm = new PersonOrmEntity();
    orm.id = person.id;
    orm.firstName = person.firstName;
    orm.lastName = person.lastName;
    orm.documentNumber = person.documentNumber;
    orm.birthDate = person.birthDate;
    orm.sex = person.sex;
    orm.childrenCount = person.childrenCount;
    orm.createdAt = person.createdAt;
    orm.updatedAt = person.updatedAt;
    return orm;
  }
}
