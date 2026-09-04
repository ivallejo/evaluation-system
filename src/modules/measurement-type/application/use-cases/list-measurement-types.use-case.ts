import { Inject } from '@nestjs/common';
import type { MeasurementType } from '../../domain/entities/measurement-type.entity.js';
import type { MeasurementTypeRepository } from '../../domain/repositories/measurement-type.repository.js';

export class ListMeasurementTypesUseCase {
  constructor(
    @Inject('MeasurementTypeRepository')
    private readonly measurementTypeRepository: MeasurementTypeRepository,
  ) {}

  async execute(): Promise<MeasurementType[]> {
    return this.measurementTypeRepository.findAll();
  }
}
