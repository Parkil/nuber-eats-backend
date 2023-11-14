import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, //true 로 설정되면 validator 가 설정되지 않은 속성값을 무시
      forbidNonWhitelisted: true, //true 로 설정시 validator 가 설정되지 않은 속성 또는 Object 에 설정되지 않은 값이 들어오게 되면 예외표시
      transform: true,
      transformOptions: {
        // @ValidateNested 를 설정시 하위 object 가 TypeScript 로 구성되었을 경우 정상적으로 변환되도록 설정
        enableImplicitConversion: true,
      },
    })
  );
  await app.listen(4000);
}

bootstrap();
