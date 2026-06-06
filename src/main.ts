import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { join } from 'path';
import { TypeOrmExceptionFilter } from './helpers/typeorm-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new TypeOrmExceptionFilter());

  app.useStaticAssets(join(process.cwd(), 'images'), {
    prefix: '/images',
  });

  const config = new DocumentBuilder()
    .setTitle('Cat Bracelet API')
    .setDescription('The Cat Bracelet API description')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description:
          'Dán cục Access Token (Bearer) của ông vào đây để xác thực',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app
    .getHttpAdapter()
    .getInstance()
    .get('/', (_req: Request, res: Response) => {
      const baseUrl = (process.env.url_base_BE || '').replace(/\/$/, '');
      const docsPath = '/api/docs';

      if (baseUrl) {
        return res.redirect(`${baseUrl}${docsPath}`);
      }

      return res.redirect(docsPath);
    });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
