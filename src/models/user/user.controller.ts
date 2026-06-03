import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';

import { RegisterUserDto } from './dto/register-user.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';

import { AddUserRoleDto } from './dto/add-user-role.dto';
import { RemoveUserRoleDto } from './dto/remove-user-role.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Step 1: Save temporary user data and send OTP to email',
  })
  @ApiResponse({
    status: 201,
    description: 'Registration successful, OTP sent',
  })
  register(@Body() registerUserDto: RegisterUserDto) {
    return this.userService.registerUser(registerUserDto);
  }

  @Post('verify-otp')
  @ApiOperation({
    summary: 'Verify OTP for registration',
    description: 'Step 2: Verify OTP and activate the account',
  })
  @ApiResponse({ status: 200, description: 'OTP verified, user activated' })
  verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.userService.verifyOtp(verifyOtpDto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description: 'Step 3: Authenticate user and return access + refresh tokens',
  })
  @ApiResponse({ status: 200, description: 'Login successful' })
  login(@Body() loginUserDto: LoginUserDto) {
    return this.userService.loginUser(loginUserDto);
  }

  @Post('refresh-token')
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Step 4: Generate a new access token using a refresh token',
  })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.userService.refreshToken(refreshTokenDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Logout user',
    description:
      'Revoke the refresh token and logout using access token from header',
  })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  logout(@CurrentUser() user: User, @Body() logoutDto: LogoutDto) {
    return this.userService.logoutUser(logoutDto, user.id);
  }

  @Post('request-password-reset')
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Step 1 of reset password: Send OTP to email',
  })
  @ApiResponse({ status: 200, description: 'OTP sent' })
  requestPasswordReset(@Body() requestResetDto: RequestPasswordResetDto) {
    return this.userService.requestPasswordReset(requestResetDto);
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset password',
    description: 'Step 2 of reset password: Verify OTP and set new password',
  })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.userService.resetPassword(resetPasswordDto);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new user (Admin)',
    description: 'Directly create a user in the database',
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieve a list of all users',
  })
  findAll() {
    return this.userService.findAll();
  }

  @Get('profile/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Retrieve profile details for a specific user',
  })
  getProfile(@Param('id') id: string) {
    return this.userService.getProfile(id);
  }

  @Patch('profile/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Update basic profile information for a user',
  })
  updateProfile(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
    return this.userService.updateProfile(id, updateDto);
  }

  @Post('change-password/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Change user password',
    description: 'Update user password after verifying the old one',
  })
  changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(id, changePasswordDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve details for a specific user by their unique ID',
  })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update user (Admin)',
    description: 'Update any user field by ID',
  })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Post(':id/roles')
  @ApiOperation({
    summary: 'Add role to user',
    description: 'Assign a specific role to a user',
  })
  addRole(@Param('id') userId: string, @Body() addUserRoleDto: AddUserRoleDto) {
    return this.userService.addRoleToUser(userId, addUserRoleDto.roleId);
  }

  @Delete(':id/roles')
  @ApiOperation({
    summary: 'Remove role from user',
    description: 'Remove a specific role from a user',
  })
  removeRole(
    @Param('id') userId: string,
    @Body() removeUserRoleDto: RemoveUserRoleDto,
  ) {
    return this.userService.removeRoleFromUser(
      userId,
      removeUserRoleDto.roleId,
    );
  }

  @Delete(':id/soft-delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Soft delete user (Admin)',
    description: 'Change user status to DELETED or other status',
  })
  softDelete(@Param('id') id: string) {
    return this.userService.softDelete(id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete user (Admin)',
    description: 'Remove a user from the system',
  })
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
