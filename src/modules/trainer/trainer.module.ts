import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateTrainerUseCase } from './application/use-cases/create-trainer.use-case.js';
import { GetTrainerUseCase } from './application/use-cases/get-trainer.use-case.js';
import { ListTrainersUseCase } from './application/use-cases/list-trainers.use-case.js';
import { TrainerOrmEntity } from './infrastructure/persistence/trainer.orm-entity.js';
import { TrainerTypeOrmRepository } from './infrastructure/repositories/trainer.typeorm-repository.js';
import { TrainerController } from './interfaces/http/trainer.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([TrainerOrmEntity])],
  controllers: [TrainerController],
  providers: [
    {
      provide: 'TrainerRepository',
      useClass: TrainerTypeOrmRepository,
    },
    CreateTrainerUseCase,
    GetTrainerUseCase,
    ListTrainersUseCase,
  ],
  exports: ['TrainerRepository', GetTrainerUseCase],
})
export class TrainerModule {}
