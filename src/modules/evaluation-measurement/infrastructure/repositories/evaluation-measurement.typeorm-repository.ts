import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EvaluationMeasurement } from '../../domain/entities/evaluation-measurement.entity.js';
import type { EvaluationMeasurementRepository } from '../../domain/repositories/evaluation-measurement.repository.js';
import { EvaluationMeasurementOrmEntity } from '../persistence/evaluation-measurement.orm-entity.js';

@Injectable()
export class EvaluationMeasurementTypeOrmRepository
  implements EvaluationMeasurementRepository
{
  constructor(private readonly dataSource: DataSource) {}

  async findByEvaluationId(evaluationId: string): Promise<EvaluationMeasurement[]> {
    const orms = await this.dataSource
      .getRepository(EvaluationMeasurementOrmEntity)
      .find({ where: { evaluationId } });
    return orms.map((o) => this.toDomain(o));
  }

  async findByEvaluationIdAndMeasurementTypeId(
    evaluationId: string,
    measurementTypeId: string,
  ): Promise<EvaluationMeasurement | null> {
    const orm = await this.dataSource
      .getRepository(EvaluationMeasurementOrmEntity)
      .findOne({ where: { evaluationId, measurementTypeId } });
    return orm ? this.toDomain(orm) : null;
  }

  async saveMany(
    measurements: EvaluationMeasurement[],
  ): Promise<EvaluationMeasurement[]> {
    if (measurements.length === 0) return [];
    const repo = this.dataSource.getRepository(EvaluationMeasurementOrmEntity);
    const orms = measurements.map((m) => repo.create(this.toOrm(m)));
    const saved = await repo.save(orms);
    return saved.map((o) => this.toDomain(o));
  }

  private toDomain(orm: EvaluationMeasurementOrmEntity): EvaluationMeasurement {
    return new EvaluationMeasurement(
      orm.id,
      orm.evaluationId,
      orm.measurementTypeId,
      Number(orm.value),
      orm.createdAt,
      orm.updatedAt,
    );
  }

  private toOrm(measurement: EvaluationMeasurement): EvaluationMeasurementOrmEntity {
    const orm = new EvaluationMeasurementOrmEntity();
    orm.id = measurement.id;
    orm.evaluationId = measurement.evaluationId;
    orm.measurementTypeId = measurement.measurementTypeId;
    orm.value = measurement.value;
    orm.createdAt = measurement.createdAt;
    orm.updatedAt = measurement.updatedAt;
    return orm;
  }
}
