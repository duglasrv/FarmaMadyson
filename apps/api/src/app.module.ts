import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { SentryModule } from '@sentry/nestjs/setup';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { CaslModule } from './casl/casl.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { BrandsModule } from './brands/brands.module';
import { InventoryModule } from './inventory/inventory.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { RolesModule } from './roles/roles.module';
import { PromotionsModule } from './promotions/promotions.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { ReportsModule } from './reports/reports.module';
import { PagesModule } from './pages/pages.module';
import { AlertsModule } from './alerts/alerts.module';
import { UsersModule } from './users/users.module';
import { SettingsModule } from './settings/settings.module';
import { BannersModule } from './banners/banners.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { EmailModule } from './email/email.module';
import { ReviewsModule } from './reviews/reviews.module';
import { StorageModule } from './storage/storage.module';
import { PosModule } from './pos/pos.module';
import { AuditLogInterceptor } from './common/audit-log.interceptor';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { CaslAbilityGuard } from './casl/casl-ability.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    SentryModule.forRoot(),
    PrismaModule,
    RedisModule,
    AuthModule,
    CaslModule,
    ProductsModule,
    CategoriesModule,
    BrandsModule,
    InventoryModule,
    SuppliersModule,
    PurchaseOrdersModule,
    CartModule,
    OrdersModule,
    DashboardModule,
    RolesModule,
    PromotionsModule,
    PrescriptionsModule,
    ReportsModule,
    PagesModule,
    AlertsModule,
    UsersModule,
    SettingsModule,
    BannersModule,
    AuditLogsModule,
    EmailModule,
    ReviewsModule,
    StorageModule,
    PosModule,
    HealthModule,
  ],
  providers: [
    // Sentry error filter — must be first
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
    // Global JWT guard — all routes require auth unless @Public()
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Global CASL guard — checks @RequirePermission() when present
    { provide: APP_GUARD, useClass: CaslAbilityGuard },
    // Audit log — records all mutating admin actions
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
  ],
})
export class AppModule {}
