import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../../../shared/interfaces/response/error-response.dto.js';
import { CreateTrainerDto } from '../../application/dto/create-trainer.dto.js';
import { TrainerResponseDto } from '../../application/dto/trainer-response.dto.js';
import { CreateTrainerUseCase } from '../../application/use-cases/create-trainer.use-case.js';
import { GetTrainerUseCase } from '../../application/use-cases/get-trainer.use-case.js';
import { ListTrainersUseCase } from '../../application/use-cases/list-trainers.use-case.js';

@ApiTags('Trainers')
@Controller('trainers')
export class TrainerController {
  constructor(
    private readonly createTrainerUseCase: CreateTrainerUseCase,
    private readonly getTrainerUseCase: GetTrainerUseCase,
    private readonly listTrainersUseCase: ListTrainersUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new trainer' })
  @ApiResponse({ status: 201, type: TrainerResponseDto, description: 'Trainer created successfully' })
  @ApiResponse({ status: 400, type: ErrorResponseDto, description: 'Validation error' })
  async create(@Body() dto: CreateTrainerDto): Promise<TrainerResponseDto> {
    const trainer = await this.createTrainerUseCase.execute(dto);
    return TrainerResponseDto.fromDomain(trainer);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all trainers' })
  @ApiResponse({ status: 200, type: [TrainerResponseDto], description: 'List of all trainers' })
  async findAll(): Promise<TrainerResponseDto[]> {
    const trainers = await this.listTrainersUseCase.execute();
    return trainers.map(TrainerResponseDto.fromDomain);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a trainer by ID' })
  @ApiParam({ name: 'id', description: 'Trainer UUID' })
  @ApiResponse({ status: 200, type: TrainerResponseDto, description: 'Trainer found' })
  @ApiResponse({ status: 404, type: ErrorResponseDto, description: 'Trainer not found' })
  async findOne(@Param('id') id: string): Promise<TrainerResponseDto> {
    const trainer = await this.getTrainerUseCase.execute(id);
    return TrainerResponseDto.fromDomain(trainer);
  }
}
