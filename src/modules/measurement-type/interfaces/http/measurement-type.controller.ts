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
import { CreateMeasurementTypeDto } from '../../application/dto/create-measurement-type.dto.js';
import { MeasurementTypeResponseDto } from '../../application/dto/measurement-type-response.dto.js';
import { CreateMeasurementTypeUseCase } from '../../application/use-cases/create-measurement-type.use-case.js';
import { GetMeasurementTypeUseCase } from '../../application/use-cases/get-measurement-type.use-case.js';
import { ListMeasurementTypesUseCase } from '../../application/use-cases/list-measurement-types.use-case.js';

@ApiTags('MeasurementTypes')
@Controller('measurement-types')
export class MeasurementTypeController {
  constructor(
    private readonly createMeasurementTypeUseCase: CreateMeasurementTypeUseCase,
    private readonly getMeasurementTypeUseCase: GetMeasurementTypeUseCase,
    private readonly listMeasurementTypesUseCase: ListMeasurementTypesUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new measurement type' })
  @ApiResponse({
    status: 201,
    type: MeasurementTypeResponseDto,
    description: 'MeasurementType created successfully',
  })
  @ApiResponse({
    status: 400,
    type: ErrorResponseDto,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 409,
    type: ErrorResponseDto,
    description: 'Code already exists',
  })
  async create(
    @Body() dto: CreateMeasurementTypeDto,
  ): Promise<MeasurementTypeResponseDto> {
    const measurementType = await this.createMeasurementTypeUseCase.execute(dto);
    return MeasurementTypeResponseDto.fromDomain(measurementType);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all measurement types' })
  @ApiResponse({
    status: 200,
    type: [MeasurementTypeResponseDto],
    description: 'List of all measurement types',
  })
  async findAll(): Promise<MeasurementTypeResponseDto[]> {
    const measurementTypes = await this.listMeasurementTypesUseCase.execute();
    return measurementTypes.map(MeasurementTypeResponseDto.fromDomain);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a measurement type by ID' })
  @ApiParam({ name: 'id', description: 'MeasurementType UUID' })
  @ApiResponse({
    status: 200,
    type: MeasurementTypeResponseDto,
    description: 'MeasurementType found',
  })
  @ApiResponse({
    status: 404,
    type: ErrorResponseDto,
    description: 'MeasurementType not found',
  })
  async findOne(@Param('id') id: string): Promise<MeasurementTypeResponseDto> {
    const measurementType = await this.getMeasurementTypeUseCase.execute(id);
    return MeasurementTypeResponseDto.fromDomain(measurementType);
  }
}
