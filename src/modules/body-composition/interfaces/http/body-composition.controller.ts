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
import { CreateBodyCompositionDto } from '../../application/dto/create-body-composition.dto.js';
import { BodyCompositionResponseDto } from '../../application/dto/body-composition-response.dto.js';
import { CreateBodyCompositionUseCase } from '../../application/use-cases/create-body-composition.use-case.js';
import { GetBodyCompositionUseCase } from '../../application/use-cases/get-body-composition.use-case.js';

@ApiTags('BodyComposition')
@Controller('evaluations/:evaluationId/body-composition')
export class BodyCompositionController {
  constructor(
    private readonly createBodyCompositionUseCase: CreateBodyCompositionUseCase,
    private readonly getBodyCompositionUseCase: GetBodyCompositionUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create body composition record for an evaluation' })
  @ApiParam({ name: 'evaluationId', description: 'Evaluation UUID' })
  @ApiResponse({
    status: 201,
    type: BodyCompositionResponseDto,
    description: 'Body composition record created successfully',
  })
  @ApiResponse({ status: 400, type: ErrorResponseDto, description: 'Validation error' })
  @ApiResponse({ status: 404, type: ErrorResponseDto, description: 'Evaluation not found' })
  @ApiResponse({ status: 409, type: ErrorResponseDto, description: 'Body composition already exists for this evaluation' })
  async create(
    @Param('evaluationId') evaluationId: string,
    @Body() dto: CreateBodyCompositionDto,
  ): Promise<BodyCompositionResponseDto> {
    const bc = await this.createBodyCompositionUseCase.execute({
      evaluationId,
      ...dto,
    });
    return BodyCompositionResponseDto.fromDomain(bc);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get body composition record for an evaluation' })
  @ApiParam({ name: 'evaluationId', description: 'Evaluation UUID' })
  @ApiResponse({
    status: 200,
    type: BodyCompositionResponseDto,
    description: 'Body composition record found',
  })
  @ApiResponse({ status: 404, type: ErrorResponseDto, description: 'Evaluation or body composition not found' })
  async findOne(
    @Param('evaluationId') evaluationId: string,
  ): Promise<BodyCompositionResponseDto> {
    const bc = await this.getBodyCompositionUseCase.execute(evaluationId);
    return BodyCompositionResponseDto.fromDomain(bc);
  }
}
