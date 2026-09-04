import { Inject } from '@nestjs/common';
import type { MeasurementType } from '../../domain/entities/measurement-type.entity.js';
import type { MeasurementTypeRepository } from '../../domain/repositories/measurement-type.repository.js';
import { NotFoundException } from '../../../../shared/domain/exceptions/not-found.exception.js';

export class GetMeasurementTypeUseCase {
  constructor(
    @Inject('MeasurementTypeRepository')
    private readonly measurementTypeRepository: MeasurementTypeRepository,
  ) {}

  async execute(id: string): Promise<MeasurementType> {
    const measurementType = await this.measurementTypeRepository.findById(id);
    if (!measurementType) {
      throw new NotFoundException('MeasurementType not found');
    }
    return measurementType;
  }
}
