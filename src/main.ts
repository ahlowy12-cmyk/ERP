import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. تفعيل Helmet لحماية الـ HTTP Headers من ثغرات الويب المعروفة
  app.use(helmet());

  // 2. تفعيل الـ CORS والسماح لدومين الفرونت إند فقط بالاتصال
  app.enableCors({
    origin: process.env.ALLOWED_ORIGIN || 'https://erp.petroflow.com',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 3. تفعيل جدار الحماية للبيانات (Validation Pipe) عالمياً باستخدام الـ DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // يزيل أي حقول غير مسجلة في الـ DTO
      forbidNonWhitelisted: true, // يرفض الطلب إذا احتوى حقولاً غريبة
      transform: true, // يحول القيم للأنواع الصحيحة (مثل تحويل النصوص لأرقام)
    }),
  );

  // 4. تفعيل مصيدة الأخطاء الشاملة (لالتقاط أخطاء MongoDB و NestJS وتوحيد شكلها)
  app.useGlobalFilters(new AllExceptionsFilter());

  // 5. تفعيل موحد الاستجابات (لجعل الـ Response دائماً بصيغة {success, statusCode, message, data})
  app.useGlobalInterceptors(new TransformInterceptor());

  // 6. إعدادات وتفعيل التوثيق الآلي (Swagger)
  const config = new DocumentBuilder()
    .setTitle('PetroFlow ERP API')
    .setDescription(
      'The core backend API for PetroFlow Procurement, Inventory, and Auth',
    )
    .setVersion('1.0')
    .addBearerAuth() // يضيف زر إدخال الـ JWT Token في صفحة التوثيق
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // 7. تشغيل السيرفر
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(
    `🚀 PetroFlow ERP is running successfully on: http://localhost:${port}`,
  );
  console.log(
    `📚 Swagger documentation is available at: http://localhost:${port}/api/docs`,
  );
}
bootstrap();
