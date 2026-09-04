import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationModule } from '../evaluation/evaluation.module.js';
import { MeasurementTypeModule } from '../measurement-type/measurement-type.module.js';
import { CreateMeasurementUseCase } from './application/use-cases/create-measurement.use-case.js';
import { GetMeasurementsUseCase } from './application/use-cases/get-measurements.use-case.js';
import { EvaluationMeasurementOrmEntity } from './infrastructure/persistence/evaluation-measurement.orm-entity.js';
import { EvaluationMeasurementTypeOrmRepository } from './infrastructure/repositories/evaluation-measurement.typeorm-repository.js';
import { EvaluationMeasurementController } from './interfaces/http/evaluation-measurement.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([EvaluationMeasurementOrmEntity]),
    EvaluationModule,
    MeasurementTypeModule,
  ],
  controllers: [EvaluationMeasurementController],
  providers: [
    {
      provide: 'EvaluationMeasurementRepository',
      useClass: EvaluationMeasurementTypeOrmRepository,
    },
    CreateMeasurementUseCase,
    GetMeasurementsUseCase,
  ],
  exports: ['EvaluationMeasurementRepository'],
})
export class EvaluationMeasurementModule {}
