import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import * as Joi from 'joi';

// 🛡️ استيراد الحراس (Guards) العالمية
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';

// 📦 استيراد الموديولات المشتركة وقاعدة البيانات
import { DatabaseModule } from './DB/database.module';
import { SharedModule } from './shared/shared.module';

// 👥 استيراد موديولات المصادقة والإدارة
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/admin/users/users.module';
import { RolesModule } from './modules/admin/roles/roles.module';
import { DepartmentsModule } from './modules/admin/departments/departments.module';

// 🛒 استيراد موديولات دورة العمل
import { PurchaseRequestsModule } from './modules/procurement/purchase-requests/purchase-requests.module';
import { PurchaseOrdersModule } from './modules/procurement/purchase-orders/purchase-orders.module';
import { MrvsModule } from './modules/inventory/mrvs/mrvs.module';

@Module({
  imports: [
    // 1. إعدادات متغيرات البيئة
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        MONGO_URI: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        ALLOWED_ORIGIN: Joi.string().optional(),
        // Mail settings (optional — will use SMTP defaults if not provided)
        MAIL_HOST: Joi.string().optional(),
        MAIL_PORT: Joi.number().optional(),
        MAIL_USER: Joi.string().optional(),
        MAIL_PASS: Joi.string().optional(),
        MAIL_FROM: Joi.string().optional(),
        FRONTEND_URL: Joi.string().optional(),
        ADMIN_EMAIL: Joi.string().email().optional(),
        ADMIN_DEFAULT_PASSWORD: Joi.string().optional(),
      }),
    }),

    // 2. إعدادات الـ Rate Limiting
    ThrottlerModule.forRoot([
      { ttl: 60000, limit: 100 },
    ]),

    // 3. الاتصال بـ MongoDB
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'),
      }),
    }),

    // 4. المهام المجدولة
    ScheduleModule.forRoot(),

    // 5. الموديولات التأسيسية
    DatabaseModule,
    SharedModule,

    // 6. موديولات المصادقة والإدارة
    AuthModule,
    UsersModule,
    RolesModule,
    DepartmentsModule,

    // 7. موديولات الـ ERP
    PurchaseRequestsModule,
    PurchaseOrdersModule,
    MrvsModule,
  ],

  providers: [
    // Rate Limiter (أولاً)
    { provide: APP_GUARD, useClass: ThrottlerGuard },

    // JWT Authentication (ثانياً)
    { provide: APP_GUARD, useClass: JwtAuthGuard },

    // Permissions Guard (ثالثاً)
    { provide: APP_GUARD, useClass: PermissionsGuard },

    // Roles Guard (رابعاً)
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
