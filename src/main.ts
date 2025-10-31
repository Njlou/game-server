import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors();
  await app.listen(3000);

  console.log('🚀 Game server running on http://localhost:3000');
  console.log('🎮 Game client: http://localhost:3000/');
}
bootstrap();