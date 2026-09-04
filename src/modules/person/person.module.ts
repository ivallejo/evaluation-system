import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreatePersonUseCase } from './application/use-cases/create-person.use-case.js';
import { GetPersonUseCase } from './application/use-cases/get-person.use-case.js';
import { ListPersonsUseCase } from './application/use-cases/list-persons.use-case.js';
import { UpdatePersonUseCase } from './application/use-cases/update-person.use-case.js';
import { PersonOrmEntity } from './infrastructure/persistence/person.orm-entity.js';
import { PersonTypeOrmRepository } from './infrastructure/repositories/person.typeorm-repository.js';
import { PersonController } from './interfaces/http/person.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([PersonOrmEntity])],
  controllers: [PersonController],
  providers: [
    {
      provide: 'PersonRepository',
      useClass: PersonTypeOrmRepository,
    },
    CreatePersonUseCase,
    GetPersonUseCase,
    ListPersonsUseCase,
    UpdatePersonUseCase,
  ],
  exports: ['PersonRepository', GetPersonUseCase],
})
export class PersonModule {}
