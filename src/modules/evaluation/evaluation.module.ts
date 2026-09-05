import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonModule } from '../person/person.module.js';
import { TrainerModule } from '../trainer/trainer.module.js';
import { MeasurementTypeModule } from '../measurement-type/measurement-type.module.js';
import { BodyCompositionTypeOrmRepository } from '../body-composition/infrastructure/repositories/body-composition.typeorm-repository.js';
import { EvaluationMeasurementTypeOrmRepository } from '../evaluation-measurement/infrastructure/repositories/evaluation-measurement.typeorm-repository.js';
import { DietaryHabitsTypeOrmRepository } from '../dietary-habits/infrastructure/repositories/dietary-habits.typeorm-repository.js';
import { TypeOrmTransactionHelper } from '../../shared/infrastructure/database/typeorm-transaction.helper.js';
import { CreateEvaluationUseCase } from './application/use-cases/create-evaluation.use-case.js';
import { GetEvaluationUseCase } from './application/use-cases/get-evaluation.use-case.js';
import { GetProgressUseCase } from './application/use-cases/get-progress.use-case.js';
import { ListPersonEvaluationsUseCase } from './application/use-cases/list-person-evaluations.use-case.js';
import { EvaluationOrmEntity } from './infrastructure/persistence/evaluation.orm-entity.js';
import { EvaluationTypeOrmRepository } from './infrastructure/repositories/evaluation.typeorm-repository.js';
import { EvaluationController } from './interfaces/http/evaluation.controller.js';
import { ProgressTypeOrmRepository } from '../../shared/infrastructure/repositories/progress.typeorm-repository.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([EvaluationOrmEntity]),
    PersonModule,
    TrainerModule,
    MeasurementTypeModule,
  ],
  controllers: [EvaluationController],
  providers: [
    {
      provide: 'EvaluationRepository',
      useClass: EvaluationTypeOrmRepository,
    },
    {
      provide: 'TransactionManager',
      useClass: TypeOrmTransactionHelper,
    },
    {
      provide: 'ProgressRepository',
      useClass: ProgressTypeOrmRepository,
    },
    {
      provide: 'BodyCompositionRepository',
      useClass: BodyCompositionTypeOrmRepository,
    },
    {
      provide: 'EvaluationMeasurementRepository',
      useClass: EvaluationMeasurementTypeOrmRepository,
    },
    {
      provide: 'DietaryHabitsRepository',
      useClass: DietaryHabitsTypeOrmRepository,
    },
    CreateEvaluationUseCase,
    GetEvaluationUseCase,
    ListPersonEvaluationsUseCase,
    GetProgressUseCase,
  ],
  exports: [
    'EvaluationRepository',
    GetEvaluationUseCase,
    ListPersonEvaluationsUseCase,
    GetProgressUseCase,
  ],
})
export class EvaluationModule {}
