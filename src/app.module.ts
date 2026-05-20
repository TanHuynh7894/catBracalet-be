import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RoleModule } from './models/role/role.module';
import { UserModule } from './models/user/user.module';
import { CartModule } from './models/cart/cart.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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

        return {
          type: 'postgres',
          host: configService.get<string>('host_DB'),
          port: parseInt(configService.get<string>('port_DB') || '5432', 10),
          username: configService.get<string>('user_DB'),
          password: configService.get<string>('password_DB'),
          database: configService.get<string>('name_DB'),
          autoLoadEntities: true,
          synchronize: false, // set to true for auto DB creation during dev
        };
      },
    }),
    RoleModule,
    UserModule,
    CartModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor() {
    console.log('✅ Connection to the Database has been successfully established.');
  }
}
