import { EvaluationMeasurement } from '../entities/evaluation-measurement.entity.js';

export interface EvaluationMeasurementRepository {
  findByEvaluationId(evaluationId: string): Promise<EvaluationMeasurement[]>;
  findByEvaluationIdAndMeasurementTypeId(
    evaluationId: string,
    measurementTypeId: string,
  ): Promise<EvaluationMeasurement | null>;
  saveMany(measurements: EvaluationMeasurement[]): Promise<EvaluationMeasurement[]>;
}
