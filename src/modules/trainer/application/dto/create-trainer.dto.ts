import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTrainerDto {
  @ApiProperty({ example: 'John', description: 'First name of the trainer' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name of the trainer' })
  @IsString()
  @IsNotEmpty()
  lastName: string;
}
