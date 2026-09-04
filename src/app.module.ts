import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import Joi from 'joi';
import { RequestIdMiddleware } from './shared/infrastructure/logging/request-id.middleware.js';
import { StructuredLoggerService } from './shared/infrastructure/logging/structured-logger.service.js';
import { HealthController } from './shared/interfaces/http/health.controller.js';
import { PersonModule } from './modules/person/person.module.js';
import { TrainerModule } from './modules/trainer/trainer.module.js';
import { MeasurementTypeModule } from './modules/measurement-type/measurement-type.module.js';
import { EvaluationModule } from './modules/evaluation/evaluation.module.js';
import { EvaluationMeasurementModule } from './modules/evaluation-measurement/evaluation-measurement.module.js';
import { BodyCompositionModule } from './modules/body-composition/body-composition.module.js';
import { DietaryHabitsModule } from './modules/dietary-habits/dietary-habits.module.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envValidationSchema = Joi.object({
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  PORT: Joi.number().default(3000),
}).unknown(true);

@Module({
  imports: [
    PersonModule,
    TrainerModule,
    MeasurementTypeModule,
    EvaluationModule,
    EvaluationMeasurementModule,
    BodyCompositionModule,
    DietaryHabitsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validate(config: Record<string, unknown>) {
        const { error, value } = envValidationSchema.validate(config, {
          abortEarly: false,
        });
        if (error) {
          const details = error.details.map((d) => d.message).join(', ');
          throw new Error(`Config validation error: ${details}`);
        }
        return value as Record<string, unknown>;
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DATABASE_HOST'),
        port: config.get<number>('DATABASE_PORT') ?? 5432,
        database: config.get<string>('DATABASE_NAME'),
        username: config.get<string>('DATABASE_USER'),
        password: config.get<string>('DATABASE_PASSWORD'),
        synchronize: false,
        entities: [join(__dirname, '/modules/**/*.orm-entity{.ts,.js}')],
        migrations: [join(__dirname, '/database/migrations/*{.ts,.js}')],
        migrationsRun: false,
      }),
    }),
  ],
  controllers: [HealthController],
  providers: [StructuredLoggerService],
  exports: [StructuredLoggerService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
