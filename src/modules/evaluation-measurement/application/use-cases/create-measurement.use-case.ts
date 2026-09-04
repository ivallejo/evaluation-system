import { randomUUID } from 'crypto';
import { Inject } from '@nestjs/common';
import { EvaluationMeasurement } from '../../domain/entities/evaluation-measurement.entity.js';
import type { EvaluationMeasurementRepository } from '../../domain/repositories/evaluation-measurement.repository.js';
import type { EvaluationRepository } from '../../../evaluation/domain/repositories/evaluation.repository.js';
import type { MeasurementTypeRepository } from '../../../measurement-type/domain/repositories/measurement-type.repository.js';
import { NotFoundException } from '../../../../shared/domain/exceptions/not-found.exception.js';
import { ConflictException } from '../../../../shared/domain/exceptions/conflict.exception.js';

export interface CreateMeasurementInput {
  evaluationId: string;
  measurements: Array<{ measurementTypeId: string; value: number }>;
}

export class CreateMeasurementUseCase {
  constructor(
    @Inject('EvaluationRepository')
    private readonly evaluationRepository: EvaluationRepository,
    @Inject('MeasurementTypeRepository')
    private readonly measurementTypeRepository: MeasurementTypeRepository,
    @Inject('EvaluationMeasurementRepository')
    private readonly evaluationMeasurementRepository: EvaluationMeasurementRepository,
  ) {}

  async execute(input: CreateMeasurementInput): Promise<EvaluationMeasurement[]> {
    // 1. Verify evaluation exists
    const evaluation = await this.evaluationRepository.findById(input.evaluationId);
    if (!evaluation) {
      throw new NotFoundException('Evaluation not found');
    }

    // 2. Verify all measurementTypeIds exist
    const measurementTypeIds = input.measurements.map((m) => m.measurementTypeId);
    if (measurementTypeIds.length > 0) {
      const foundTypes =
        await this.measurementTypeRepository.findAllByIds(measurementTypeIds);
      if (foundTypes.length !== measurementTypeIds.length) {
        throw new NotFoundException('MeasurementType not found');
      }
    }

    // 3. Check for duplicate (evaluationId, measurementTypeId) combinations
    for (const measurement of input.measurements) {
      const existing =
        await this.evaluationMeasurementRepository.findByEvaluationIdAndMeasurementTypeId(
          input.evaluationId,
          measurement.measurementTypeId,
        );
      if (existing) {
        throw new ConflictException(
          `Measurement with measurementTypeId ${measurement.measurementTypeId} already exists for this evaluation`,
        );
      }
    }

    // 4. Build and persist the measurement entities
    const now = new Date();
    const entities = input.measurements.map(
      (m) =>
        new EvaluationMeasurement(
          randomUUID(),
          input.evaluationId,
          m.measurementTypeId,
          m.value,
          now,
          now,
        ),
    );

    return this.evaluationMeasurementRepository.saveMany(entities);
  }
}
