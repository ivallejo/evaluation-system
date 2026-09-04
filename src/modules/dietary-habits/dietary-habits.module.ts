import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationModule } from '../evaluation/evaluation.module.js';
import { UpsertDietaryHabitsUseCase } from './application/use-cases/upsert-dietary-habits.use-case.js';
import { GetDietaryHabitsUseCase } from './application/use-cases/get-dietary-habits.use-case.js';
import { DietaryHabitsOrmEntity } from './infrastructure/persistence/dietary-habits.orm-entity.js';
import { DietaryHabitsTypeOrmRepository } from './infrastructure/repositories/dietary-habits.typeorm-repository.js';
import { DietaryHabitsController } from './interfaces/http/dietary-habits.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([DietaryHabitsOrmEntity]),
    EvaluationModule,
  ],
  controllers: [DietaryHabitsController],
  providers: [
    {
      provide: 'DietaryHabitsRepository',
      useClass: DietaryHabitsTypeOrmRepository,
    },
    UpsertDietaryHabitsUseCase,
    GetDietaryHabitsUseCase,
  ],
  exports: ['DietaryHabitsRepository', GetDietaryHabitsUseCase],
})
export class DietaryHabitsModule {}
