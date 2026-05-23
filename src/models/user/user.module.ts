import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { OtpService } from './services/otp.service';
import { JwtTokenService } from './services/jwt-token.service';
import { Role } from '../role/entities/role.entity';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    JwtModule.register({}),
    forwardRef(() => AuthModule),
  ],
  controllers: [UserController],
  providers: [UserService, OtpService, JwtTokenService],
  exports: [JwtModule, JwtTokenService, UserService, OtpService],
})
export class UserModule {}
