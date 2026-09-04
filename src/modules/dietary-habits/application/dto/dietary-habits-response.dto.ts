import { ApiProperty } from '@nestjs/swagger';
import { DietaryHabits } from '../../domain/entities/dietary-habits.entity.js';

export class DietaryHabitsResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  evaluationId: string;

  @ApiProperty({
    example: 'Dieta alta en proteínas, baja en carbohidratos. Come 5 veces al día.',
  })
  description: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;

  static fromDomain(dh: DietaryHabits): DietaryHabitsResponseDto {
    const dto = new DietaryHabitsResponseDto();
    dto.id = dh.id;
    dto.evaluationId = dh.evaluationId;
    dto.description = dh.description;
    dto.createdAt = dh.createdAt;
    dto.updatedAt = dh.updatedAt;
    return dto;
  }
}
