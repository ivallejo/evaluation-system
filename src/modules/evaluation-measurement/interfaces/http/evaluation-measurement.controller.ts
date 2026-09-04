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
import { CreateMeasurementsDto } from '../../application/dto/create-measurements.dto.js';
import { EvaluationMeasurementResponseDto } from '../../application/dto/evaluation-measurement-response.dto.js';
import { CreateMeasurementUseCase } from '../../application/use-cases/create-measurement.use-case.js';
import { GetMeasurementsUseCase } from '../../application/use-cases/get-measurements.use-case.js';

@ApiTags('Measurements')
@Controller('evaluations/:evaluationId/measurements')
export class EvaluationMeasurementController {
  constructor(
    private readonly createMeasurementUseCase: CreateMeasurementUseCase,
    private readonly getMeasurementsUseCase: GetMeasurementsUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create measurements for an evaluation' })
  @ApiParam({ name: 'evaluationId', description: 'Evaluation UUID' })
  @ApiResponse({
    status: 201,
    type: [EvaluationMeasurementResponseDto],
    description: 'Measurements created successfully',
  })
  @ApiResponse({
    status: 400,
    type: ErrorResponseDto,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 404,
    type: ErrorResponseDto,
    description: 'Evaluation or MeasurementType not found',
  })
  @ApiResponse({
    status: 409,
    type: ErrorResponseDto,
    description: 'Duplicate measurementTypeId for this evaluation',
  })
  async create(
    @Param('evaluationId') evaluationId: string,
    @Body() dto: CreateMeasurementsDto,
  ): Promise<EvaluationMeasurementResponseDto[]> {
    const measurements = await this.createMeasurementUseCase.execute({
      evaluationId,
      measurements: dto.measurements,
    });
    return measurements.map(EvaluationMeasurementResponseDto.fromDomain);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all measurements for an evaluation' })
  @ApiParam({ name: 'evaluationId', description: 'Evaluation UUID' })
  @ApiResponse({
    status: 200,
    type: [EvaluationMeasurementResponseDto],
    description: 'List of measurements for the evaluation',
  })
  @ApiResponse({
    status: 404,
    type: ErrorResponseDto,
    description: 'Evaluation not found',
  })
  async findAll(
    @Param('evaluationId') evaluationId: string,
  ): Promise<EvaluationMeasurementResponseDto[]> {
    const measurements = await this.getMeasurementsUseCase.execute(evaluationId);
    return measurements.map(EvaluationMeasurementResponseDto.fromDomain);
  }
}
