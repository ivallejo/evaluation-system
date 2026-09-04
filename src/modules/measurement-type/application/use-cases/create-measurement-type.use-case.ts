import { randomUUID } from 'crypto';
import { Inject } from '@nestjs/common';
import {
  MeasurementType,
  type MeasurementCategory,
} from '../../domain/entities/measurement-type.entity.js';
import type { MeasurementTypeRepository } from '../../domain/repositories/measurement-type.repository.js';
import { ConflictException } from '../../../../shared/domain/exceptions/conflict.exception.js';
import { ValidationException } from '../../../../shared/domain/exceptions/validation.exception.js';

export interface CreateMeasurementTypeInput {
  code: string;
  name: string;
  unit: string;
  category: string;
}

const VALID_CATEGORIES: MeasurementCategory[] = ['superior', 'inferior'];

export class CreateMeasurementTypeUseCase {
  constructor(
    @Inject('MeasurementTypeRepository')
    private readonly measurementTypeRepository: MeasurementTypeRepository,
  ) {}

  async execute(input: CreateMeasurementTypeInput): Promise<MeasurementType> {
    if (!VALID_CATEGORIES.includes(input.category as MeasurementCategory)) {
      throw new ValidationException([
        `category must be one of: ${VALID_CATEGORIES.join(', ')}`,
      ]);
    }

    const existing = await this.measurementTypeRepository.findByCode(
      input.code,
    );
    if (existing) {
      throw new ConflictException('code already exists');
    }

    const now = new Date();
    const measurementType = new MeasurementType(
      randomUUID(),
      input.code,
      input.name,
      input.unit,
      input.category as MeasurementCategory,
      true,
      now,
      now,
    );

    return this.measurementTypeRepository.save(measurementType);
  }
}
