import { PartialType } from '@nestjs/swagger';
import { CreatePersonDto } from './create-person.dto.js';

export class UpdatePersonDto extends PartialType(CreatePersonDto) {}
