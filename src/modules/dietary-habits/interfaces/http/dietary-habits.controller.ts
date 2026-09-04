import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../../../shared/interfaces/response/error-response.dto.js';
import { UpsertDietaryHabitsDto } from '../../application/dto/upsert-dietary-habits.dto.js';
import { DietaryHabitsResponseDto } from '../../application/dto/dietary-habits-response.dto.js';
import { UpsertDietaryHabitsUseCase } from '../../application/use-cases/upsert-dietary-habits.use-case.js';
import { GetDietaryHabitsUseCase } from '../../application/use-cases/get-dietary-habits.use-case.js';

@ApiTags('DietaryHabits')
@Controller('evaluations')
export class DietaryHabitsController {
  constructor(
    private readonly upsertDietaryHabitsUseCase: UpsertDietaryHabitsUseCase,
    private readonly getDietaryHabitsUseCase: GetDietaryHabitsUseCase,
  ) {}

  @Put(':evaluationId/dietary-habits')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create or update dietary habits for an evaluation' })
  @ApiParam({ name: 'evaluationId', description: 'Evaluation UUID' })
  @ApiResponse({
    status: 200,
    type: DietaryHabitsResponseDto,
    description: 'Dietary habits created or updated successfully',
  })
  @ApiResponse({
    status: 400,
    type: ErrorResponseDto,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 404,
    type: ErrorResponseDto,
    description: 'Evaluation not found',
  })
  async upsert(
    @Param('evaluationId') evaluationId: string,
    @Body() dto: UpsertDietaryHabitsDto,
  ): Promise<DietaryHabitsResponseDto> {
    const dietaryHabits = await this.upsertDietaryHabitsUseCase.execute({
      evaluationId,
      description: dto.description,
    });
    return DietaryHabitsResponseDto.fromDomain(dietaryHabits);
  }

  @Get(':evaluationId/dietary-habits')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get dietary habits for an evaluation' })
  @ApiParam({ name: 'evaluationId', description: 'Evaluation UUID' })
  @ApiResponse({
    status: 200,
    type: DietaryHabitsResponseDto,
    description: 'Dietary habits found',
  })
  @ApiResponse({
    status: 404,
    type: ErrorResponseDto,
    description: 'Evaluation or dietary habits not found',
  })
  async findOne(
    @Param('evaluationId') evaluationId: string,
  ): Promise<DietaryHabitsResponseDto> {
    const dietaryHabits = await this.getDietaryHabitsUseCase.execute(evaluationId);
    return DietaryHabitsResponseDto.fromDomain(dietaryHabits);
  }
}
