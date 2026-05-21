import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';


import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { User } from './entities/user.entity';
import { ChangePasswordDto } from './dto/change-password.dto';

import { OtpService } from './services/otp.service';
import { JwtTokenService } from './services/jwt-token.service';

interface PendingUserData {
  email: string;
  fullName: string;
  password: string;
  phone?: string;
}

interface JwtPayload {
  userId: string;
  email: string;
}

import { Role } from '../role/entities/role.entity';


@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private otpService: OtpService,
    private jwtTokenService: JwtTokenService,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) { }

  /**
   * Bước 1: Đăng ký người dùng - lưu tạm thời, gửi OTP
   */
  async registerUser(
    registerUserDto: RegisterUserDto,
  ): Promise<{ message: string; email: string }> {
    const { email, fullName, password, phone } = registerUserDto;

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException('Email đã được đăng ký');
    }

    if (this.otpService.hasPendingUser(email)) {
      throw new BadRequestException(
        'Email đang chờ xác thực OTP. Vui lòng kiểm tra email của bạn.',
      );
    }

    if (password.length < 6) {
      throw new BadRequestException('Mật khẩu phải có ít nhất 6 ký tự');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    this.otpService.savePendingUser(email, fullName, hashedPassword, phone);

    return {
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực OTP.',
      email,
    };
  }

  /**
   * Bước 2: Xác thực OTP và lưu User vào DB
   */
  async verifyOtp(
    verifyOtpDto: VerifyOtpDto,
  ): Promise<{ message: string; user: User }> {
    const { email, otp } = verifyOtpDto;

    const pendingUser = this.otpService.verifyOtp(
      email,
      otp,
    ) as PendingUserData | null;
    if (!pendingUser) {
      throw new BadRequestException('OTP không hợp lệ hoặc đã hết hạn');
    }

    const newUser = this.userRepository.create({
      email: pendingUser.email,
      fullName: pendingUser.fullName,
      password: pendingUser.password,
      phone: pendingUser.phone,
      status: 'ACTIVE',
    });

    const savedUser = await this.userRepository.save(newUser);
    this.otpService.removePendingUser(email);

    return {
      message: 'Xác thực OTP thành công. Tài khoản đã được kích hoạt!',
      user: savedUser,
    };
  }

  /**
   * Bước 3: Đăng nhập - trả về cặp Access + Refresh Token
   */
  async loginUser(loginUserDto: LoginUserDto): Promise<{
    message: string;
    user: Omit<User, 'password'>;
    accessToken: string;
    refreshToken: string;
  }> {
    const { email, password } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['roles'],
    });
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tài khoản của bạn không hoạt động');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const accessToken = this.jwtTokenService.generateAccessToken(
      user.id,
      user.email,
    );
    const refreshToken = this.jwtTokenService.generateRefreshToken(
      user.id,
      user.email,
    );

    const refreshTokenExpiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    );
    this.otpService.saveRefreshToken(
      refreshToken,
      user.id,
      refreshTokenExpiresAt,
    );

    // Tạo object mới không chứa password
    const userResponse = {
      id: user.id,
      vipLevelId: user.vipLevelId,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      status: user.status,
      totalSpending: user.totalSpending,
      vipUpdatedAt: user.vipUpdatedAt,
      createdAt: user.createdAt,
      roles: user.roles,
    };

    return {
      message: 'Đăng nhập thành công',
      user: userResponse,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Bước 4: Refresh Token - sinh Access Token mới từ Refresh Token
   */
  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { refreshToken } = refreshTokenDto;

    const jwtPayload = this.jwtTokenService.verifyRefreshToken(
      refreshToken,
    ) as JwtPayload | null;
    if (!jwtPayload) {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ hoặc đã hết hạn',
      );
    }

    const tokenData = this.otpService.getRefreshTokenData(refreshToken);
    if (!tokenData) {
      throw new UnauthorizedException(
        'Refresh token không tồn tại hoặc đã hết hạn',
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: jwtPayload.userId },
    });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tài khoản không hoạt động');
    }

    const newAccessToken = this.jwtTokenService.generateAccessToken(
      user.id,
      user.email,
    );

    const newRefreshToken = this.jwtTokenService.generateRefreshToken(
      user.id,
      user.email,
    );

    this.otpService.removeRefreshToken(refreshToken);
    const newRefreshTokenExpiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    );
    this.otpService.saveRefreshToken(
      newRefreshToken,
      user.id,
      newRefreshTokenExpiresAt,
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Bước 5: Logout - hủy Refresh Token
   */
  logoutUser(logoutDto: LogoutDto): { message: string } {
    const { refreshToken } = logoutDto;

    const jwtPayload = this.jwtTokenService.verifyRefreshToken(
      refreshToken,
    ) as JwtPayload | null;
    if (!jwtPayload) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    const tokenData = this.otpService.getRefreshTokenData(refreshToken);
    if (!tokenData) {
      throw new UnauthorizedException('Refresh token không tồn tại');
    }

    this.otpService.removeRefreshToken(refreshToken);

    return {
      message: 'Đăng xuất thành công',
    };
  }

  // ========== LUỒNG RESET PASSWORD ==========

  /**
   * Bước 1: Yêu cầu reset password - gửi OTP đến email
   */
  async requestPasswordReset(
    requestResetDto: RequestPasswordResetDto,
  ): Promise<{ message: string; email: string }> {
    const { email } = requestResetDto;

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException(
        'Email này không tồn tại trong hệ thống. Vui lòng kiểm tra lại.',
      );
    }

    this.otpService.savePasswordResetOtp(email);

    return {
      message: 'OTP reset password đã được gửi tới email của bạn.',
      email,
    };
  }

  /**
   * Bước 2: Reset password - xác thực OTP và cập nhật mật khẩu mới
   */
  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { email, otp, newPassword } = resetPasswordDto;

    const resetOtpData = this.otpService.verifyPasswordResetOtp(email, otp);
    if (!resetOtpData) {
      throw new BadRequestException('OTP không hợp lệ hoặc đã hết hạn');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('Mật khẩu mới phải có ít nhất 6 ký tự');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }

    user.password = hashedPassword;
    await this.userRepository.save(user);

    this.otpService.removePasswordResetOtp(email);

    return {
      message:
        'Reset password thành công. Vui lòng đăng nhập với mật khẩu mới.',
    };
  }

  /**
   * Các hàm có sẵn
   */
  create(createUserDto: CreateUserDto) {
    const newUser = this.userRepository.create(createUserDto);
    return this.userRepository.save(newUser);
  }

  findAll() {
    return this.userRepository.find({
      relations: ['roles'],
    });
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.userRepository.update(id, updateUserDto);
  }


  async addRoleToUser(userId: string, roleId: string): Promise<User> {
    const user = await this.findOne(userId);
    const role = await this.roleRepository.findOneBy({ id: roleId, status: 'ACTIVE' });
    if (!role) {
      throw new NotFoundException(`Active Role with id ${roleId} not found`);
    }

    const hasRole = user.roles.some((r) => r.id === roleId);
    if (!hasRole) {
      user.roles.push(role);
      await this.userRepository.save(user);
    }
    return user;
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<User> {
    const user = await this.findOne(userId);

    user.roles = user.roles.filter((r) => r.id !== roleId);
    await this.userRepository.save(user);
    return user;
  }

  async getProfile(id: string): Promise<Omit<User, 'password' | 'roles'>> {
    const user = await this.findOne(id);
    const { password, ...result } = user;
    return result;
  }

  async updateProfile(id: string, updateDto: UpdateUserDto): Promise<Omit<User, 'password'>> {
    const user = await this.findOne(id);

    // Chỉ cho phép cập nhật 1 số trường
    if (updateDto.fullName) user.fullName = updateDto.fullName;
    if (updateDto.phone) user.phone = updateDto.phone;
    if (updateDto.avatar) user.avatar = updateDto.avatar;

    const updatedUser = await this.userRepository.save(user);
    const { password: _, ...result } = updatedUser;
    return result;
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const { oldPassword, newPassword } = changePasswordDto;

    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('Mật khẩu mới phải có ít nhất 6 ký tự');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);

    return { message: 'Đổi mật khẩu thành công' };
  }

  remove(id: string) {
    return this.userRepository.delete(id);
  }
}

