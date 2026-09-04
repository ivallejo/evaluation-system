import { randomUUID } from 'crypto';
import { Inject } from '@nestjs/common';
import { Evaluation } from '../../domain/entities/evaluation.entity.js';
import type { EvaluationRepository } from '../../domain/repositories/evaluation.repository.js';
import type { PersonRepository } from '../../../person/domain/repositories/person.repository.js';
import type { TrainerRepository } from '../../../trainer/domain/repositories/trainer.repository.js';
import type { MeasurementTypeRepository } from '../../../measurement-type/domain/repositories/measurement-type.repository.js';
import { BodyComposition } from '../../../body-composition/domain/entities/body-composition.entity.js';
import { EvaluationMeasurement } from '../../../evaluation-measurement/domain/entities/evaluation-measurement.entity.js';
import { DietaryHabits } from '../../../dietary-habits/domain/entities/dietary-habits.entity.js';
import { NotFoundException } from '../../../../shared/domain/exceptions/not-found.exception.js';
import { ConflictException } from '../../../../shared/domain/exceptions/conflict.exception.js';
import type { TransactionManager } from '../../../../shared/domain/transaction-manager.interface.js';

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface CreateMeasurementInput {
  measurementTypeId: string;
  value: number;
}

export interface CreateBodyCompositionInput {
  weightKg: number;
  heightM: number;
  bmi?: number;
  bodyFatPercentage?: number;
  muscleMassPercentage?: number;
  idealWeightKg?: number;
  idealBmi?: number;
  idealBodyFatPercentage?: number;
}

export interface CreateDietaryHabitsInput {
  description: string;
}

export interface CreateEvaluationInput {
  personId: string;
  trainerId?: string;
  evaluationDate: Date;
  objective?: string;
  trainingLevel?: string;
  preExistingInjuries?: string;
  importantMedicalDiagnosis?: string;
  otherComments?: string;
  bodyComposition: CreateBodyCompositionInput;
  measurements: CreateMeasurementInput[];
  dietaryHabits?: CreateDietaryHabitsInput;
}

export interface EvaluationResult {
  evaluation: Evaluation;
  bodyComposition: BodyComposition;
  measurements: EvaluationMeasurement[];
  dietaryHabits: DietaryHabits | null;
}

// ---------------------------------------------------------------------------
// Use Case
// ---------------------------------------------------------------------------

export class CreateEvaluationUseCase {
  constructor(
    @Inject('PersonRepository')
    private readonly personRepository: PersonRepository,
    @Inject('TrainerRepository')
    private readonly trainerRepository: TrainerRepository,
    @Inject('MeasurementTypeRepository')
    private readonly measurementTypeRepository: MeasurementTypeRepository,
    @Inject('TransactionManager')
    private readonly transactionManager: TransactionManager,
  ) {}

  async execute(input: CreateEvaluationInput): Promise<EvaluationResult> {
    // ── Pre-transaction validations (fail-fast) ──────────────────────────

    const person = await this.personRepository.findById(input.personId);
    if (!person) {
      throw new NotFoundException('Person not found');
    }

    if (input.trainerId) {
      const trainer = await this.trainerRepository.findById(input.trainerId);
      if (!trainer) {
        throw new NotFoundException('Trainer not found');
      }
    }

    const measurementTypeIds = input.measurements.map((m) => m.measurementTypeId);

    if (new Set(measurementTypeIds).size !== measurementTypeIds.length) {
      throw new ConflictException('Duplicate measurementTypeId in measurements');
    }

    if (measurementTypeIds.length > 0) {
      const found =
        await this.measurementTypeRepository.findAllByIds(measurementTypeIds);
      if (found.length !== measurementTypeIds.length) {
        throw new NotFoundException('MeasurementType not found');
      }
    }

    // ── Transactional execution ──────────────────────────────────────────

    return this.transactionManager.execute(async (tx) => {
      const now = new Date();

      // Save Evaluation
      const evaluation = await tx.evaluationRepository.save(
        new Evaluation(
          randomUUID(),
          input.personId,
          input.evaluationDate,
          now,
          now,
          input.trainerId,
          input.objective,
          input.trainingLevel,
          input.preExistingInjuries,
          input.importantMedicalDiagnosis,
          input.otherComments,
        ),
      );

      // Save BodyComposition
      const bc = input.bodyComposition;
      const bodyComposition = await tx.bodyCompositionRepository.save(
        new BodyComposition(
          randomUUID(),
          evaluation.id,
          bc.weightKg,
          bc.heightM,
          now,
          now,
          bc.bmi,
          bc.bodyFatPercentage,
          bc.muscleMassPercentage,
          bc.idealWeightKg,
          bc.idealBmi,
          bc.idealBodyFatPercentage,
        ),
      );

      // Save EvaluationMeasurements (if any)
      const measurements =
        input.measurements.length > 0
          ? await tx.measurementRepository.saveMany(
              input.measurements.map(
                (m) =>
                  new EvaluationMeasurement(
                    randomUUID(),
                    evaluation.id,
                    m.measurementTypeId,
                    m.value,
                    now,
                    now,
                  ),
              ),
            )
          : [];

      // Save DietaryHabits (if provided)
      const dietaryHabits = input.dietaryHabits
        ? await tx.dietaryHabitsRepository.save(
            new DietaryHabits(
              randomUUID(),
              evaluation.id,
              input.dietaryHabits.description,
              now,
              now,
            ),
          )
        : null;

      return { evaluation, bodyComposition, measurements, dietaryHabits };
    });
  }
}
