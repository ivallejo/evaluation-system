import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../../../shared/interfaces/response/error-response.dto.js';
import { CreateEvaluationDto } from '../../application/dto/create-evaluation.dto.js';
import { CreateEvaluationResponseDto } from '../../application/dto/create-evaluation-response.dto.js';
import { EvaluationResponseDto } from '../../application/dto/evaluation-response.dto.js';
import { ProgressRecordResponseDto } from '../../application/dto/progress-record-response.dto.js';
import { CreateEvaluationUseCase } from '../../application/use-cases/create-evaluation.use-case.js';
import { GetEvaluationUseCase } from '../../application/use-cases/get-evaluation.use-case.js';
import { GetProgressUseCase } from '../../application/use-cases/get-progress.use-case.js';
import { ListPersonEvaluationsUseCase } from '../../application/use-cases/list-person-evaluations.use-case.js';

@ApiTags('Evaluations')
@Controller()
export class EvaluationController {
  constructor(
    private readonly createEvaluationUseCase: CreateEvaluationUseCase,
    private readonly getEvaluationUseCase: GetEvaluationUseCase,
    private readonly listPersonEvaluationsUseCase: ListPersonEvaluationsUseCase,
    private readonly getProgressUseCase: GetProgressUseCase,
  ) {}

  @Post('persons/:personId/evaluations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a complete evaluation for a person (transactional)' })
  @ApiParam({ name: 'personId', description: 'Person UUID' })
  @ApiResponse({
    status: 201,
    type: CreateEvaluationResponseDto,
    description: 'Evaluation created successfully with all sub-components',
  })
  @ApiResponse({ status: 400, type: ErrorResponseDto, description: 'Validation error' })
  @ApiResponse({ status: 404, type: ErrorResponseDto, description: 'Person, Trainer or MeasurementType not found' })
  @ApiResponse({ status: 409, type: ErrorResponseDto, description: 'Duplicate measurementTypeId in measurements' })
  @ApiResponse({ status: 500, type: ErrorResponseDto, description: 'Internal server error' })
  async create(
    @Param('personId') personId: string,
    @Body() dto: CreateEvaluationDto,
  ): Promise<CreateEvaluationResponseDto> {
    const result = await this.createEvaluationUseCase.execute({
      personId,
      trainerId: dto.trainerId,
      evaluationDate: new Date(dto.evaluationDate),
      objective: dto.objective,
      trainingLevel: dto.trainingLevel,
      preExistingInjuries: dto.preExistingInjuries,
      importantMedicalDiagnosis: dto.importantMedicalDiagnosis,
      otherComments: dto.otherComments,
      bodyComposition: dto.bodyComposition,
      measurements: dto.measurements,
      dietaryHabits: dto.dietaryHabits,
    });
    return CreateEvaluationResponseDto.fromResult(result);
  }

  @Get('persons/:personId/evaluations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all evaluations for a person' })
  @ApiParam({ name: 'personId', description: 'Person UUID' })
  @ApiResponse({
    status: 200,
    type: [EvaluationResponseDto],
    description: 'List of evaluations ordered by date descending',
  })
  @ApiResponse({ status: 404, type: ErrorResponseDto, description: 'Person not found' })
  async listPersonEvaluations(
    @Param('personId') personId: string,
  ): Promise<EvaluationResponseDto[]> {
    const evaluations = await this.listPersonEvaluationsUseCase.execute(personId);
    return evaluations.map(EvaluationResponseDto.fromDomain);
  }

  @Get('evaluations/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get an evaluation by ID' })
  @ApiParam({ name: 'id', description: 'Evaluation UUID' })
  @ApiResponse({
    status: 200,
    type: EvaluationResponseDto,
    description: 'Evaluation found with associated body composition, measurements and dietary habits',
  })
  @ApiResponse({ status: 404, type: ErrorResponseDto, description: 'Evaluation not found' })
  @ApiResponse({ status: 500, type: ErrorResponseDto, description: 'Internal server error' })
  async findOne(@Param('id') id: string): Promise<EvaluationResponseDto> {
    const evaluation = await this.getEvaluationUseCase.execute(id);
    return EvaluationResponseDto.fromDomain(evaluation);
  }

  @Get('persons/:personId/progress')
  @HttpCode(HttpStatus.OK)
  @ApiTags('Progress')
  @ApiOperation({ summary: 'Get historical progress for a person' })
  @ApiParam({ name: 'personId', description: 'Person UUID' })
  @ApiResponse({
    status: 200,
    type: [ProgressRecordResponseDto],
    description: 'Progress records ordered by evaluation date ascending',
  })
  @ApiResponse({ status: 404, type: ErrorResponseDto, description: 'Person not found' })
  async getProgress(
    @Param('personId') personId: string,
  ): Promise<ProgressRecordResponseDto[]> {
    const records = await this.getProgressUseCase.execute(personId);
    return records.map(ProgressRecordResponseDto.fromRecord);
  }
}
