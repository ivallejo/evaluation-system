import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trainer } from '../../domain/entities/trainer.entity.js';
import { TrainerRepository } from '../../domain/repositories/trainer.repository.js';
import { TrainerOrmEntity } from '../persistence/trainer.orm-entity.js';

@Injectable()
export class TrainerTypeOrmRepository implements TrainerRepository {
  constructor(
    @InjectRepository(TrainerOrmEntity)
    private readonly ormRepository: Repository<TrainerOrmEntity>,
  ) {}

  async findById(id: string): Promise<Trainer | null> {
    const entity = await this.ormRepository.findOne({ where: { id } });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findAll(): Promise<Trainer[]> {
    const entities = await this.ormRepository.find();
    return entities.map((e) => this.toDomain(e));
  }

  async save(trainer: Trainer): Promise<Trainer> {
    const ormEntity = this.toOrm(trainer);
    const saved = await this.ormRepository.save(ormEntity);
    return this.toDomain(saved);
  }

  private toDomain(entity: TrainerOrmEntity): Trainer {
    return new Trainer(
      entity.id,
      entity.firstName,
      entity.lastName,
      entity.active,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  private toOrm(trainer: Trainer): TrainerOrmEntity {
    const entity = new TrainerOrmEntity();
    entity.id = trainer.id;
    entity.firstName = trainer.firstName;
    entity.lastName = trainer.lastName;
    entity.active = trainer.active;
    entity.createdAt = trainer.createdAt;
    entity.updatedAt = trainer.updatedAt;
    return entity;
  }
}
