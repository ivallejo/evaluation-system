import type { MeasurementType } from '../entities/measurement-type.entity.js';

export interface MeasurementTypeRepository {
  findById(id: string): Promise<MeasurementType | null>;
  findByCode(code: string): Promise<MeasurementType | null>;
  findAll(): Promise<MeasurementType[]>;
  findAllByIds(ids: string[]): Promise<MeasurementType[]>;
  save(measurementType: MeasurementType): Promise<MeasurementType>;
}
