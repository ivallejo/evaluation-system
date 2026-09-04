import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpsertDietaryHabitsDto {
  @ApiProperty({
    example: 'Dieta alta en proteínas, baja en carbohidratos. Come 5 veces al día.',
    description: 'Descripción de los hábitos alimenticios',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}
