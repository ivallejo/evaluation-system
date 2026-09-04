import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationModule } from '../evaluation/evaluation.module.js';
import { CreateBodyCompositionUseCase } from './application/use-cases/create-body-composition.use-case.js';
import { GetBodyCompositionUseCase } from './application/use-cases/get-body-composition.use-case.js';
import { BodyCompositionOrmEntity } from './infrastructure/persistence/body-composition.orm-entity.js';
import { BodyCompositionTypeOrmRepository } from './infrastructure/repositories/body-composition.typeorm-repository.js';
import { BodyCompositionController } from './interfaces/http/body-composition.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([BodyCompositionOrmEntity]),
    EvaluationModule,
  ],
  controllers: [BodyCompositionController],
  providers: [
    {
      provide: 'BodyCompositionRepository',
      useClass: BodyCompositionTypeOrmRepository,
    },
    CreateBodyCompositionUseCase,
    GetBodyCompositionUseCase,
  ],
  exports: ['BodyCompositionRepository', GetBodyCompositionUseCase],
})
export class BodyCompositionModule {}
