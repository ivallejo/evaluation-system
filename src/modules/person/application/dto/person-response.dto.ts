import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Person } from '../../domain/entities/person.entity.js';

export class PersonResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Juan' })
  firstName: string;

  @ApiProperty({ example: 'Pérez' })
  lastName: string;

  @ApiPropertyOptional({ example: 'DNI12345678' })
  documentNumber?: string;

  @ApiPropertyOptional({ example: '1990-05-15' })
  birthDate?: Date;

  @ApiPropertyOptional({ enum: ['male', 'female', 'other'], example: 'male' })
  sex?: 'male' | 'female' | 'other';

  @ApiPropertyOptional({ example: 2, minimum: 0 })
  childrenCount?: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;

  static fromDomain(person: Person): PersonResponseDto {
    const dto = new PersonResponseDto();
    dto.id = person.id;
    dto.firstName = person.firstName;
    dto.lastName = person.lastName;
    dto.documentNumber = person.documentNumber;
    dto.birthDate = person.birthDate;
    dto.sex = person.sex;
    dto.childrenCount = person.childrenCount;
    dto.createdAt = person.createdAt;
    dto.updatedAt = person.updatedAt;
    return dto;
  }
}
