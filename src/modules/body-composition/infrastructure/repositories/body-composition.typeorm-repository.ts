import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BodyComposition } from '../../domain/entities/body-composition.entity.js';
import type { BodyCompositionRepository } from '../../domain/repositories/body-composition.repository.js';
import { BodyCompositionOrmEntity } from '../persistence/body-composition.orm-entity.js';

@Injectable()
export class BodyCompositionTypeOrmRepository
  implements BodyCompositionRepository
{
  constructor(private readonly dataSource: DataSource) {}

  async findByEvaluationId(
    evaluationId: string,
  ): Promise<BodyComposition | null> {
    const orm = await this.dataSource
      .getRepository(BodyCompositionOrmEntity)
      .findOne({ where: { evaluationId } });
    return orm ? this.toDomain(orm) : null;
  }

  async save(bodyComposition: BodyComposition): Promise<BodyComposition> {
    const repo = this.dataSource.getRepository(BodyCompositionOrmEntity);
    const orm = repo.create(this.toOrm(bodyComposition));
    const saved = await repo.save(orm);
    return this.toDomain(saved);
  }

  private toDomain(orm: BodyCompositionOrmEntity): BodyComposition {
    return new BodyComposition(
      orm.id,
      orm.evaluationId,
      Number(orm.weightKg),
      Number(orm.heightM),
      orm.createdAt,
      orm.updatedAt,
      orm.bmi !== undefined && orm.bmi !== null ? Number(orm.bmi) : undefined,
      orm.bodyFatPercentage !== undefined && orm.bodyFatPercentage !== null
        ? Number(orm.bodyFatPercentage)
        : undefined,
      orm.muscleMassPercentage !== undefined && orm.muscleMassPercentage !== null
        ? Number(orm.muscleMassPercentage)
        : undefined,
      orm.idealWeightKg !== undefined && orm.idealWeightKg !== null
        ? Number(orm.idealWeightKg)
        : undefined,
      orm.idealBmi !== undefined && orm.idealBmi !== null
        ? Number(orm.idealBmi)
        : undefined,
      orm.idealBodyFatPercentage !== undefined &&
      orm.idealBodyFatPercentage !== null
        ? Number(orm.idealBodyFatPercentage)
        : undefined,
    );
  }

  private toOrm(bc: BodyComposition): BodyCompositionOrmEntity {
    const orm = new BodyCompositionOrmEntity();
    orm.id = bc.id;
    orm.evaluationId = bc.evaluationId;
    orm.weightKg = String(bc.weightKg);
    orm.heightM = String(bc.heightM);
    orm.bmi = bc.bmi !== undefined ? String(bc.bmi) : undefined;
    orm.bodyFatPercentage =
      bc.bodyFatPercentage !== undefined
        ? String(bc.bodyFatPercentage)
        : undefined;
    orm.muscleMassPercentage =
      bc.muscleMassPercentage !== undefined
        ? String(bc.muscleMassPercentage)
        : undefined;
    orm.idealWeightKg =
      bc.idealWeightKg !== undefined ? String(bc.idealWeightKg) : undefined;
    orm.idealBmi = bc.idealBmi !== undefined ? String(bc.idealBmi) : undefined;
    orm.idealBodyFatPercentage =
      bc.idealBodyFatPercentage !== undefined
        ? String(bc.idealBodyFatPercentage)
        : undefined;
    orm.createdAt = bc.createdAt;
    orm.updatedAt = bc.updatedAt;
    return orm;
  }
}
