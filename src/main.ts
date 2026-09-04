import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './shared/interfaces/http/global-exception.filter.js';
import { RequestIdInterceptor } from './shared/interfaces/http/request-id.interceptor.js';
import { StructuredLoggerService } from './shared/infrastructure/logging/structured-logger.service.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const loggerService = app.get(StructuredLoggerService);
  app.useGlobalInterceptors(new RequestIdInterceptor(loggerService));

  const config = new DocumentBuilder()
    .setTitle('Sistema de Evaluaciones Físicas/Antropométricas')
    .setDescription(
      'REST API para el control y seguimiento de evaluaciones físicas y antropométricas',
    )
    .setVersion('1.0')
    .addTag('Persons')
    .addTag('Trainers')
    .addTag('MeasurementTypes')
    .addTag('Evaluations')
    .addTag('BodyComposition')
    .addTag('Measurements')
    .addTag('DietaryHabits')
    .addTag('Progress')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;
  await app.listen(port);
}
await bootstrap();
