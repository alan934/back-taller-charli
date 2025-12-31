import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.use(helmet());
  app.enableCors({
    origin: configService.get<string>('app.frontendOrigin') || '*',
    credentials: true,
  });

  const port = configService.get<number>('app.port') || 3001;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Auth API running on port ${port}`);
}

bootstrap();
