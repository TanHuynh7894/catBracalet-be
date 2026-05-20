import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { RegisterUserDto } from './dto/register-user.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';

import { AddUserRoleDto } from './dto/add-user-role.dto';
import { RemoveUserRoleDto } from './dto/remove-user-role.dto';


@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Đăng ký người dùng mới
   */
  @Post('register')
  register(@Body() registerUserDto: RegisterUserDto) {
    return this.userService.registerUser(registerUserDto);
  }

  /**
   * Xác thực OTP (đăng ký)
   */
  @Post('verify-otp')
  verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.userService.verifyOtp(verifyOtpDto);
  }

  /**
   * Đăng nhập
   */
  @Post('login')
  login(@Body() loginUserDto: LoginUserDto) {
    return this.userService.loginUser(loginUserDto);
  }

  /**
   * Làm mới Access Token (sử dụng Refresh Token)
   */
  @Post('refresh-token')
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.userService.refreshToken(refreshTokenDto);
  }

  /**
   * Đăng xuất
   */
  @Post('logout')
  logout(@Body() logoutDto: LogoutDto) {
    return this.userService.logoutUser(logoutDto);
  }

  /**
   * Yêu cầu reset password (gửi OTP)
   */
  @Post('request-password-reset')
  requestPasswordReset(@Body() requestResetDto: RequestPasswordResetDto) {
    return this.userService.requestPasswordReset(requestResetDto);
  }

  /**
   * Reset password (xác thực OTP + cập nhật mật khẩu)
   */
  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.userService.resetPassword(resetPasswordDto);
  }

  /**
   * Các hàm có sẵn
   */
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Post(':id/roles')
  addRole(@Param('id') userId: string, @Body() addUserRoleDto: AddUserRoleDto) {
    return this.userService.addRoleToUser(userId, addUserRoleDto.roleId);
  }

  @Delete(':id/roles')
  removeRole(@Param('id') userId: string, @Body() removeUserRoleDto: RemoveUserRoleDto) {
    return this.userService.removeRoleFromUser(userId, removeUserRoleDto.roleId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
