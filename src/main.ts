import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useStaticAssets(join(process.cwd(), 'images'), {
    prefix: '/images',
  });

  const config = new DocumentBuilder()
    .setTitle('Cat Bracelet API')
    .setDescription('The Cat Bracelet API description')
    .setVersion('1.0')
    // 🌟 THÊM ĐÚNG KHỐI NÀY ĐỂ KÍCH HOẠT NÚT AUTHORIZE TRÊN SWAGGER
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
      'JWT-auth', // Cái tên key định danh (Bắt buộc phải trùng với bên Controller)
    )
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  // Enable CORS to allow requests from the frontend (e.g., at 192.168.1.49)
  app.enableCors({
    origin: '*', // For development, allow all. You can specify ['http://192.168.1.49:5173'] later.
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
