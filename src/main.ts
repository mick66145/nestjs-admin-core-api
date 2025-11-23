import { NestFactory, Reflector } from '@nestjs/core';
import {
  ValidationPipe,
  ClassSerializerInterceptor,
  INestApplication,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import basicAuth from 'express-basic-auth';
import { SystemLoggerService } from './_libs/logger/system-logger.service';
import { AppConfigInterface } from './_libs/app/app-config.interface';
import { SwaggerConfigInterface } from './_libs/app/swagger-config.interface';
import { AppModule } from './app.module';
import { ApiKeyConfigInterface } from './_libs/auth/api-key-config.interface';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // rawBody: true, // ref: https://docs.nestjs.com/faq/raw-body
    bufferLogs: true, // ref: https://docs.nestjs.com/techniques/logger
  });

  setupApp(app);
  setupSwagger(app);

  const configService = app.get(ConfigService);
  const appConfig = configService.getOrThrow<AppConfigInterface>('app');
  await app.listen(appConfig.port);

  console.log(`app config:`, appConfig);
  console.log(
    `swagger config:`,
    configService.getOrThrow<SwaggerConfigInterface>('swagger'),
  );
}

function setupApp(app: INestApplication) {
  app.useLogger(app.get(SystemLoggerService));

  app.enableShutdownHooks();
  app.enableCors({
    origin: '*',
    allowedHeaders: '*',
    exposedHeaders: '*',
  });

  const configService = app.get(ConfigService);
  const { globalPrefix } = configService.getOrThrow<AppConfigInterface>('app');
  app.setGlobalPrefix(globalPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      // forbidNonWhitelisted: true,
      // transformOptions: { enableImplicitConversion: true },
    }),
  );

  // apply transform to all responses
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
}

function setupSwagger(app: INestApplication) {
  const configService = app.get(ConfigService);
  const swaggerConfig =
    configService.getOrThrow<SwaggerConfigInterface>('swagger');
  if (!swaggerConfig.enabled) return;

  const { name, version, globalPrefix } =
    configService.getOrThrow<AppConfigInterface>('app');
  const { endpoint, baseUrl, user, password } = swaggerConfig;
  const path = `${globalPrefix}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  if (user.length && password.length) {
    app.use(
      [`${path}`, `${path}-json`],
      basicAuth({ challenge: true, users: { [user]: password } }),
    );
  }

  const apiKeyHeader =
    configService.get<ApiKeyConfigInterface['header']>('apiKey.header');
  const builder = new DocumentBuilder()
    .setTitle(name)
    .setVersion(version)
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: apiKeyHeader, in: 'header' }, 'ApiKey');
  if (baseUrl) builder.addServer(baseUrl, 'api_server');
  const config = builder.build();

  const document = SwaggerModule.createDocument(app, config, {
    // Turn on when needing to split documents for modules
    // deepScanRoutes: true,
    // include: [],
  });
  SwaggerModule.setup(path, app, document);
}

bootstrap();
