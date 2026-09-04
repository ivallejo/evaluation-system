import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { BodyComposition } from '../../../modules/body-composition/domain/entities/body-composition.entity.js';
import { BodyCompositionOrmEntity } from '../../../modules/body-composition/infrastructure/persistence/body-composition.orm-entity.js';
import { DietaryHabits } from '../../../modules/dietary-habits/domain/entities/dietary-habits.entity.js';
import { DietaryHabitsOrmEntity } from '../../../modules/dietary-habits/infrastructure/persistence/dietary-habits.orm-entity.js';
import { Evaluation } from '../../../modules/evaluation/domain/entities/evaluation.entity.js';
import { EvaluationOrmEntity } from '../../../modules/evaluation/infrastructure/persistence/evaluation.orm-entity.js';
import { EvaluationMeasurement } from '../../../modules/evaluation-measurement/domain/entities/evaluation-measurement.entity.js';
import { EvaluationMeasurementOrmEntity } from '../../../modules/evaluation-measurement/infrastructure/persistence/evaluation-measurement.orm-entity.js';
import type {
  TransactionContext,
  TransactionManager,
} from '../../domain/transaction-manager.interface.js';

@Injectable()
export class TypeOrmTransactionHelper implements TransactionManager {
  constructor(private readonly dataSource: DataSource) {}

  async execute<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T> {
    return this.dataSource.transaction(async (em: EntityManager) => {
      const tx: TransactionContext = {
        evaluationRepository: {
          async save(evaluation: Evaluation): Promise<Evaluation> {
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

            const saved = await em.save(EvaluationOrmEntity, orm);
            return new Evaluation(
              saved.id,
              saved.personId,
              saved.evaluationDate,
              saved.createdAt,
              saved.updatedAt,
              saved.trainerId,
              saved.objective,
              saved.trainingLevel,
              saved.preExistingInjuries,
              saved.importantMedicalDiagnosis,
              saved.otherComments,
            );
          },
        },

        bodyCompositionRepository: {
          async save(bc: BodyComposition): Promise<BodyComposition> {
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
            orm.idealBmi =
              bc.idealBmi !== undefined ? String(bc.idealBmi) : undefined;
            orm.idealBodyFatPercentage =
              bc.idealBodyFatPercentage !== undefined
                ? String(bc.idealBodyFatPercentage)
                : undefined;
            orm.createdAt = bc.createdAt;
            orm.updatedAt = bc.updatedAt;

            const saved = await em.save(BodyCompositionOrmEntity, orm);
            return new BodyComposition(
              saved.id,
              saved.evaluationId,
              Number(saved.weightKg),
              Number(saved.heightM),
              saved.createdAt,
              saved.updatedAt,
              saved.bmi != null ? Number(saved.bmi) : undefined,
              saved.bodyFatPercentage != null
                ? Number(saved.bodyFatPercentage)
                : undefined,
              saved.muscleMassPercentage != null
                ? Number(saved.muscleMassPercentage)
                : undefined,
              saved.idealWeightKg != null ? Number(saved.idealWeightKg) : undefined,
              saved.idealBmi != null ? Number(saved.idealBmi) : undefined,
              saved.idealBodyFatPercentage != null
                ? Number(saved.idealBodyFatPercentage)
                : undefined,
            );
          },
        },

        measurementRepository: {
          async saveMany(
            measurements: EvaluationMeasurement[],
          ): Promise<EvaluationMeasurement[]> {
            if (measurements.length === 0) return [];

            const orms = measurements.map((m) => {
              const orm = new EvaluationMeasurementOrmEntity();
              orm.id = m.id;
              orm.evaluationId = m.evaluationId;
              orm.measurementTypeId = m.measurementTypeId;
              orm.value = m.value;
              orm.createdAt = m.createdAt;
              orm.updatedAt = m.updatedAt;
              return orm;
            });

            const saved = await em.save(EvaluationMeasurementOrmEntity, orms);
            return saved.map(
              (o) =>
                new EvaluationMeasurement(
                  o.id,
                  o.evaluationId,
                  o.measurementTypeId,
                  Number(o.value),
                  o.createdAt,
                  o.updatedAt,
                ),
            );
          },
        },

        dietaryHabitsRepository: {
          async save(dietaryHabits: DietaryHabits): Promise<DietaryHabits> {
            const orm = new DietaryHabitsOrmEntity();
            orm.id = dietaryHabits.id;
            orm.evaluationId = dietaryHabits.evaluationId;
            orm.description = dietaryHabits.description;
            orm.createdAt = dietaryHabits.createdAt;
            orm.updatedAt = dietaryHabits.updatedAt;

            const saved = await em.save(DietaryHabitsOrmEntity, orm);
            return new DietaryHabits(
              saved.id,
              saved.evaluationId,
              saved.description,
              saved.createdAt,
              saved.updatedAt,
            );
          },
        },
      };

      return work(tx);
    });
  }
}
