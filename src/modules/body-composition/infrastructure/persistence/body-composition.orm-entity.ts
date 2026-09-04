import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('body_compositions')
@Unique(['evaluationId'])
export class BodyCompositionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'evaluation_id', type: 'uuid' })
  evaluationId: string;

  @Column({ name: 'weight_kg', type: 'numeric', precision: 6, scale: 2 })
  weightKg: string;

  @Column({ name: 'height_m', type: 'numeric', precision: 4, scale: 3 })
  heightM: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  bmi?: string;

  @Column({
    name: 'body_fat_percentage',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  bodyFatPercentage?: string;

  @Column({
    name: 'muscle_mass_percentage',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  muscleMassPercentage?: string;

  @Column({
    name: 'ideal_weight_kg',
    type: 'numeric',
    precision: 6,
    scale: 2,
    nullable: true,
  })
  idealWeightKg?: string;

  @Column({
    name: 'ideal_bmi',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  idealBmi?: string;

  @Column({
    name: 'ideal_body_fat_percentage',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  idealBodyFatPercentage?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
