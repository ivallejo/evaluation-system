import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateMeasurementTypeUseCase } from './application/use-cases/create-measurement-type.use-case.js';
import { GetMeasurementTypeUseCase } from './application/use-cases/get-measurement-type.use-case.js';
import { ListMeasurementTypesUseCase } from './application/use-cases/list-measurement-types.use-case.js';
import { MeasurementTypeOrmEntity } from './infrastructure/persistence/measurement-type.orm-entity.js';
import { MeasurementTypeTypeOrmRepository } from './infrastructure/repositories/measurement-type.typeorm-repository.js';
import { MeasurementTypeController } from './interfaces/http/measurement-type.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([MeasurementTypeOrmEntity])],
  controllers: [MeasurementTypeController],
  providers: [
    {
      provide: 'MeasurementTypeRepository',
      useClass: MeasurementTypeTypeOrmRepository,
    },
    CreateMeasurementTypeUseCase,
    GetMeasurementTypeUseCase,
    ListMeasurementTypesUseCase,
  ],
  exports: ['MeasurementTypeRepository', GetMeasurementTypeUseCase, ListMeasurementTypesUseCase],
})
export class MeasurementTypeModule {}
