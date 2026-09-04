import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DietaryHabits } from '../../domain/entities/dietary-habits.entity.js';
import type { DietaryHabitsRepository } from '../../domain/repositories/dietary-habits.repository.js';
import { DietaryHabitsOrmEntity } from '../persistence/dietary-habits.orm-entity.js';

@Injectable()
export class DietaryHabitsTypeOrmRepository implements DietaryHabitsRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findByEvaluationId(
    evaluationId: string,
  ): Promise<DietaryHabits | null> {
    const orm = await this.dataSource
      .getRepository(DietaryHabitsOrmEntity)
      .findOne({ where: { evaluationId } });
    return orm ? this.toDomain(orm) : null;
  }

  async save(dietaryHabits: DietaryHabits): Promise<DietaryHabits> {
    const repo = this.dataSource.getRepository(DietaryHabitsOrmEntity);
    const orm = repo.create(this.toOrm(dietaryHabits));
    const saved = await repo.save(orm);
    return this.toDomain(saved);
  }

  async update(dietaryHabits: DietaryHabits): Promise<DietaryHabits> {
    const repo = this.dataSource.getRepository(DietaryHabitsOrmEntity);
    await repo.save(this.toOrm(dietaryHabits));
    const updated = await repo.findOneOrFail({
      where: { id: dietaryHabits.id },
    });
    return this.toDomain(updated);
  }

  private toDomain(orm: DietaryHabitsOrmEntity): DietaryHabits {
    return new DietaryHabits(
      orm.id,
      orm.evaluationId,
      orm.description,
      orm.createdAt,
      orm.updatedAt,
    );
  }

  private toOrm(dietaryHabits: DietaryHabits): DietaryHabitsOrmEntity {
    const orm = new DietaryHabitsOrmEntity();
    orm.id = dietaryHabits.id;
    orm.evaluationId = dietaryHabits.evaluationId;
    orm.description = dietaryHabits.description;
    orm.createdAt = dietaryHabits.createdAt;
    orm.updatedAt = dietaryHabits.updatedAt;
    return orm;
  }
}
