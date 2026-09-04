import { ApiProperty } from '@nestjs/swagger';
import { Trainer } from '../../domain/entities/trainer.entity.js';

export class TrainerResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;

  static fromDomain(trainer: Trainer): TrainerResponseDto {
    const dto = new TrainerResponseDto();
    dto.id = trainer.id;
    dto.firstName = trainer.firstName;
    dto.lastName = trainer.lastName;
    dto.active = trainer.active;
    dto.createdAt = trainer.createdAt;
    dto.updatedAt = trainer.updatedAt;
    return dto;
  }
}
