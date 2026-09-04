import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('evaluations')
export class EvaluationOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'person_id' })
  personId: string;

  @Column({ name: 'trainer_id', nullable: true })
  trainerId?: string;

  @Column({ type: 'date', name: 'evaluation_date' })
  evaluationDate: Date;

  @Column({ type: 'text', nullable: true })
  objective?: string;

  @Column({ name: 'training_level', nullable: true })
  trainingLevel?: string;

  @Column({ type: 'text', name: 'pre_existing_injuries', nullable: true })
  preExistingInjuries?: string;

  @Column({ type: 'text', name: 'important_medical_diagnosis', nullable: true })
  importantMedicalDiagnosis?: string;

  @Column({ type: 'text', name: 'other_comments', nullable: true })
  otherComments?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
