console.log('=== main.ts execution started ===');
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

import { env } from './config/env.config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SanitizerInterceptor } from './common/interceptors/sanitizer.interceptor';
import { ValidationPipe, Logger } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Enable Trust Proxy for Rate Limiting behind reverse proxies (Nginx/Vercel)
  app.set('trust proxy', 1);

  // 1. Establish custom WebSocket Adapter for rapid connection cycles
  app.useWebSocketAdapter(new WsAdapter(app));

  // 2. Register secure Express middleware
  app.use(helmet());
  app.use(cookieParser());

  // 3. Rigid CORS filters
  app.enableCors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // 4. Global Guards & Interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new SanitizerInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip out properties that do not use class-validator decorators
      forbidNonWhitelisted: true, // reject requests containing non-whitelisted attributes
      transform: true, // automatically cast payloads to designated DTO objects
    })
  );

  const port = env.PORT;
  await app.listen(port);
  
  logger.log(`========================================================`);
  logger.log(`🚀 QOOM AI API SERVER RUNNING ON PORT: ${port}`);
  logger.log(`🔒 SECURITY SHIELDS ACTIVE: Helmet, CORS, Sanitizers`);
  logger.log(`💻 FRONTEND WHITE-LIST ORIGIN: ${env.FRONTEND_URL}`);
  logger.log(`========================================================`);
}

bootstrap().catch((err) => {
  console.error('Fatal crash during NestJS bootstrap phase:', err);
  process.exit(1);
});
