import type { BodyCompositionRepository } from '../../modules/body-composition/domain/repositories/body-composition.repository.js';
import type { DietaryHabitsRepository } from '../../modules/dietary-habits/domain/repositories/dietary-habits.repository.js';
import type { EvaluationRepository } from '../../modules/evaluation/domain/repositories/evaluation.repository.js';
import type { EvaluationMeasurementRepository } from '../../modules/evaluation-measurement/domain/repositories/evaluation-measurement.repository.js';

export interface TransactionContext {
  evaluationRepository: Pick<EvaluationRepository, 'save'>;
  bodyCompositionRepository: Pick<BodyCompositionRepository, 'save'>;
  measurementRepository: Pick<EvaluationMeasurementRepository, 'saveMany'>;
  dietaryHabitsRepository: Pick<DietaryHabitsRepository, 'save'>;
}

export interface TransactionManager {
  execute<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T>;
}
