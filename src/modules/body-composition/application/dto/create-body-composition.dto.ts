import {
  IsNumber,
  IsOptional,
  IsPositive,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBodyCompositionDto {
  @ApiProperty({ example: 75.5, description: 'Weight in kilograms (must be > 0)' })
  @IsNumber()
  @IsPositive()
  weightKg: number;

  @ApiProperty({ example: 1.75, description: 'Height in meters (must be > 0)' })
  @IsNumber()
  @IsPositive()
  heightM: number;

  @ApiPropertyOptional({ example: 24.7, description: 'Body Mass Index' })
  @IsOptional()
  @IsNumber()
  bmi?: number;

  @ApiPropertyOptional({ example: 18.5, description: 'Body fat percentage (0–100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  bodyFatPercentage?: number;

  @ApiPropertyOptional({ example: 42.0, description: 'Muscle mass percentage (0–100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  muscleMassPercentage?: number;

  @ApiPropertyOptional({ example: 70.0, description: 'Ideal weight in kilograms' })
  @IsOptional()
  @IsNumber()
  idealWeightKg?: number;

  @ApiPropertyOptional({ example: 22.0, description: 'Ideal Body Mass Index' })
  @IsOptional()
  @IsNumber()
  idealBmi?: number;

  @ApiPropertyOptional({ example: 15.0, description: 'Ideal body fat percentage (0–100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  idealBodyFatPercentage?: number;
}
