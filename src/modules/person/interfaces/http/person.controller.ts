import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreatePersonDto } from '../../application/dto/create-person.dto.js';
import { PersonResponseDto } from '../../application/dto/person-response.dto.js';
import { UpdatePersonDto } from '../../application/dto/update-person.dto.js';
import { CreatePersonUseCase } from '../../application/use-cases/create-person.use-case.js';
import { GetPersonUseCase } from '../../application/use-cases/get-person.use-case.js';
import { ListPersonsUseCase } from '../../application/use-cases/list-persons.use-case.js';
import { UpdatePersonUseCase } from '../../application/use-cases/update-person.use-case.js';
import { ErrorResponseDto } from '../../../../shared/interfaces/response/error-response.dto.js';

@ApiTags('Persons')
@Controller('persons')
export class PersonController {
  constructor(
    private readonly createPersonUseCase: CreatePersonUseCase,
    private readonly getPersonUseCase: GetPersonUseCase,
    private readonly listPersonsUseCase: ListPersonsUseCase,
    private readonly updatePersonUseCase: UpdatePersonUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new person' })
  @ApiResponse({
    status: 201,
    type: PersonResponseDto,
    description: 'Person created successfully',
  })
  @ApiResponse({
    status: 400,
    type: ErrorResponseDto,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 409,
    type: ErrorResponseDto,
    description: 'Document number already exists',
  })
  async create(@Body() dto: CreatePersonDto): Promise<PersonResponseDto> {
    const person = await this.createPersonUseCase.execute({
      firstName: dto.firstName,
      lastName: dto.lastName,
      documentNumber: dto.documentNumber,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      sex: dto.sex,
      childrenCount: dto.childrenCount,
    });
    return PersonResponseDto.fromDomain(person);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all persons' })
  @ApiResponse({
    status: 200,
    type: [PersonResponseDto],
    description: 'List of all persons',
  })
  async findAll(): Promise<PersonResponseDto[]> {
    const persons = await this.listPersonsUseCase.execute();
    return persons.map(PersonResponseDto.fromDomain);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a person by ID' })
  @ApiParam({ name: 'id', description: 'Person UUID' })
  @ApiResponse({
    status: 200,
    type: PersonResponseDto,
    description: 'Person found',
  })
  @ApiResponse({
    status: 404,
    type: ErrorResponseDto,
    description: 'Person not found',
  })
  async findOne(@Param('id') id: string): Promise<PersonResponseDto> {
    const person = await this.getPersonUseCase.execute(id);
    return PersonResponseDto.fromDomain(person);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a person (partial update)' })
  @ApiParam({ name: 'id', description: 'Person UUID' })
  @ApiResponse({
    status: 200,
    type: PersonResponseDto,
    description: 'Person updated successfully',
  })
  @ApiResponse({
    status: 400,
    type: ErrorResponseDto,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 404,
    type: ErrorResponseDto,
    description: 'Person not found',
  })
  @ApiResponse({
    status: 409,
    type: ErrorResponseDto,
    description: 'Document number already belongs to another person',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePersonDto,
  ): Promise<PersonResponseDto> {
    const person = await this.updatePersonUseCase.execute(id, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      documentNumber: dto.documentNumber,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      sex: dto.sex,
      childrenCount: dto.childrenCount,
    });
    return PersonResponseDto.fromDomain(person);
  }
}
