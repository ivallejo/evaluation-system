import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Evaluation } from '../../domain/entities/evaluation.entity.js';
import type { EvaluationRepository } from '../../domain/repositories/evaluation.repository.js';
import { EvaluationOrmEntity } from '../persistence/evaluation.orm-entity.js';

@Injectable()
export class EvaluationTypeOrmRepository implements EvaluationRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findById(id: string): Promise<Evaluation | null> {
    const orm = await this.dataSource
      .getRepository(EvaluationOrmEntity)
      .findOne({ where: { id } });
    return orm ? this.toDomain(orm) : null;
  }

  async findByPersonId(personId: string): Promise<Evaluation[]> {
    const orms = await this.dataSource
      .getRepository(EvaluationOrmEntity)
      .find({
        where: { personId },
        order: { evaluationDate: 'DESC' },
      });
    return orms.map((o) => this.toDomain(o));
  }

  async save(evaluation: Evaluation): Promise<Evaluation> {
    const repo = this.dataSource.getRepository(EvaluationOrmEntity);
    const orm = repo.create(this.toOrm(evaluation));
    const saved = await repo.save(orm);
    return this.toDomain(saved);
  }

  private toDomain(orm: EvaluationOrmEntity): Evaluation {
    return new Evaluation(
      orm.id,
      orm.personId,
      orm.evaluationDate,
      orm.createdAt,
      orm.updatedAt,
      orm.trainerId,
      orm.objective,
      orm.trainingLevel,
      orm.preExistingInjuries,
      orm.importantMedicalDiagnosis,
      orm.otherComments,
    );
  }

  private toOrm(evaluation: Evaluation): EvaluationOrmEntity {
    const orm = new EvaluationOrmEntity();
    orm.id = evaluation.id;
    orm.personId = evaluation.personId;
    orm.trainerId = evaluation.trainerId;
    orm.evaluationDate = evaluation.evaluationDate;
    orm.objective = evaluation.objective;
    orm.trainingLevel = evaluation.trainingLevel;
    orm.preExistingInjuries = evaluation.preExistingInjuries;
    orm.importantMedicalDiagnosis = evaluation.importantMedicalDiagnosis;
    orm.otherComments = evaluation.otherComments;
    orm.createdAt = evaluation.createdAt;
    orm.updatedAt = evaluation.updatedAt;
    return orm;
  }
}
