import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CategoriesModule } from './models/categories/categories.module';
import { MaterialsModule } from './models/materials/materials.module';
import { ProductImagesModule } from './models/product-images/product-images.module';
import { ProductVariantMappingsModule } from './models/product-variant-mappings/product-variant-mappings.module';
import { ProductVariantsModule } from './models/product-variants/product-variants.module';
import { ProductsModule } from './models/products/products.module';
import { ReviewsModule } from './models/reviews/reviews.module';
import { RoleModule } from './models/role/role.module';
import { UserModule } from './models/user/user.module';
import { UserAddressModule } from './models/user_address/user_address.module';
import { VouchersModule } from './models/vouchers/vouchers.module';
import { PaymentsModule } from './models/payments/payments.module';
import { VipModule } from './models/VIP/vip.module';
import { AuthModule } from './auth/auth.module';
import { CartModule } from './models/carts/cart.module';
import { OrdersModule } from './models/orders/orders.module';
import { ProductMaterialsModule } from './models/product-materials/product-materials.module';
import { ConsultationRegistrationsModule } from './models/consultation-registrations/consultation-registrations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        console.log('--- DATABASE CONFIGURATION ---');
        console.log('Host:', configService.get<string>('host_DB'));
        console.log('Port:', configService.get<string>('port_DB'));
        console.log('Username:', configService.get<string>('user_DB'));
        console.log('Password:', configService.get<string>('password_DB'));
        console.log('Database:', configService.get<string>('name_DB'));
        console.log('------------------------------');

        console.log('--- MAIL CONFIGURATION ---');
        console.log('MAIL_HOST:', configService.get<string>('MAIL_HOST'));
        console.log('MAIL_PORT:', configService.get<string>('MAIL_PORT'));
        console.log('MAIL_USER:', configService.get<string>('MAIL_USER'));
        console.log('MAIL_FROM:', configService.get<string>('MAIL_FROM'));
        console.log('MAIL_SECURE:', configService.get<string>('MAIL_SECURE'));
        console.log('------------------------------');

        return {
          type: 'postgres',
          host: configService.get<string>('host_DB'),
          port: parseInt(configService.get<string>('port_DB') || '5432', 10),
          username: configService.get<string>('user_DB'),
          password: configService.get<string>('password_DB'),
          database: configService.get<string>('name_DB'),
          autoLoadEntities: true,
          synchronize: false,
        };
      },
    }),
    AuthModule,
    CategoriesModule,
    MaterialsModule,
    ProductImagesModule,
    ProductVariantMappingsModule,
    ProductVariantsModule,
    ProductsModule,
    ReviewsModule,
    RoleModule,
    UserModule,
    UserAddressModule,
    VouchersModule,
    PaymentsModule,
    VipModule,
    CartModule,
    OrdersModule,
    ProductMaterialsModule,
    ConsultationRegistrationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor() {
    console.log(
      '✅ Connection to the Database has been successfully established.',
    );
  }
}
