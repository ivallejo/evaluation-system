import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePersonDto {
  @ApiProperty({ example: 'Juan', description: 'First name of the person' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Pérez', description: 'Last name of the person' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({
    example: 'DNI12345678',
    description: 'Unique document number (optional)',
  })
  @IsOptional()
  @IsString()
  documentNumber?: string;

  @ApiPropertyOptional({
    example: '1990-05-15',
    description: 'Birth date in ISO 8601 format (optional)',
  })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({
    enum: ['male', 'female', 'other'],
    example: 'male',
    description: 'Biological sex (optional)',
  })
  @IsOptional()
  @IsEnum(['male', 'female', 'other'])
  sex?: 'male' | 'female' | 'other';

  @ApiPropertyOptional({
    example: 2,
    description: 'Number of children (integer >= 0, optional)',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  childrenCount?: number;
}
