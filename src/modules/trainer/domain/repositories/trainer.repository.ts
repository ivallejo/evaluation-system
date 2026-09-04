import { Trainer } from '../entities/trainer.entity.js';

export interface TrainerRepository {
  findById(id: string): Promise<Trainer | null>;
  findAll(): Promise<Trainer[]>;
  save(trainer: Trainer): Promise<Trainer>;
}
