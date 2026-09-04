import { Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import {
  MeasurementType,
  type MeasurementCategory,
} from '../../domain/entities/measurement-type.entity.js';
import type { MeasurementTypeRepository } from '../../domain/repositories/measurement-type.repository.js';
import { MeasurementTypeOrmEntity } from '../persistence/measurement-type.orm-entity.js';

@Injectable()
export class MeasurementTypeTypeOrmRepository
  implements MeasurementTypeRepository
{
  constructor(private readonly dataSource: DataSource) {}

  async findById(id: string): Promise<MeasurementType | null> {
    const orm = await this.dataSource
      .getRepository(MeasurementTypeOrmEntity)
      .findOne({ where: { id } });
    return orm ? this.toDomain(orm) : null;
  }

  async findByCode(code: string): Promise<MeasurementType | null> {
    const orm = await this.dataSource
      .getRepository(MeasurementTypeOrmEntity)
      .findOne({ where: { code } });
    return orm ? this.toDomain(orm) : null;
  }

  async findAll(): Promise<MeasurementType[]> {
    const orms = await this.dataSource
      .getRepository(MeasurementTypeOrmEntity)
      .find();
    return orms.map((o) => this.toDomain(o));
  }

  async findAllByIds(ids: string[]): Promise<MeasurementType[]> {
    if (ids.length === 0) return [];
    const orms = await this.dataSource
      .getRepository(MeasurementTypeOrmEntity)
      .find({ where: { id: In(ids) } });
    return orms.map((o) => this.toDomain(o));
  }

  async save(measurementType: MeasurementType): Promise<MeasurementType> {
    const repo = this.dataSource.getRepository(MeasurementTypeOrmEntity);
    const orm = repo.create(this.toOrm(measurementType));
    const saved = await repo.save(orm);
    return this.toDomain(saved);
  }

  private toDomain(orm: MeasurementTypeOrmEntity): MeasurementType {
    return new MeasurementType(
      orm.id,
      orm.code,
      orm.name,
      orm.unit,
      orm.category as MeasurementCategory,
      orm.active,
      orm.createdAt,
      orm.updatedAt,
    );
  }

  private toOrm(mt: MeasurementType): MeasurementTypeOrmEntity {
    const orm = new MeasurementTypeOrmEntity();
    orm.id = mt.id;
    orm.code = mt.code;
    orm.name = mt.name;
    orm.unit = mt.unit;
    orm.category = mt.category;
    orm.active = mt.active;
    orm.createdAt = mt.createdAt;
    orm.updatedAt = mt.updatedAt;
    return orm;
  }
}
