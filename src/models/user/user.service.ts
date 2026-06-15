import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { ConfigService } from '@nestjs/config';
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
import { Role } from '../role/entities/role.entity';
import { VipService } from '../VIP/vip.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly otpService: OtpService,
    private readonly jwtTokenService: JwtTokenService,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly configService: ConfigService,
    private readonly vipService: VipService,
  ) {}

  /**
   * Helper function: Clone object và sinh ra Full URL cho Avatar (Tránh lỗi nhân đôi Domain)
   */
  private formatUserAvatarUrl(user: User): User {
    if (!user) return user;

    // Tạo bản sao shallow copy để tránh chỉnh sửa trực tiếp trên reference gốc của TypeORM
    const userClone = { ...user };

    if (userClone.avatar) {
      const baseUrl =
        this.configService.get<string>('url_base_BE') ||
        this.configService.get<string>('URL_BASE_BE') ||
        'http://localhost:3000';
      const cleanBaseUrl = baseUrl.endsWith('/')
        ? baseUrl.slice(0, -1)
        : baseUrl;

      // Nếu ảnh đã có dạng http:// hoặc https:// thì bỏ qua không nối nữa
      if (
        !userClone.avatar.startsWith('http://') &&
        !userClone.avatar.startsWith('https://')
      ) {
        const cleanAvatar = userClone.avatar.startsWith('/')
          ? userClone.avatar
          : `/${userClone.avatar}`;
        userClone.avatar = `${cleanBaseUrl}${cleanAvatar}`;
      }
    }
    return userClone;
  }

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

    await this.otpService.savePendingUser(
      email,
      fullName,
      hashedPassword,
      phone,
    );

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
  ): Promise<{ message: string; user: Omit<User, 'password'> }> {
    const { email, otp } = verifyOtpDto;

    const pendingUser = this.otpService.verifyOtp(email, otp);
    if (!pendingUser) {
      throw new BadRequestException('OTP không hợp lệ hoặc đã hết hạn');
    }

    const customerRole = await this.roleRepository.findOne({
      where: { name: 'CUSTOMER', status: 'ACTIVE' },
    });

    const newUser = this.userRepository.create({
      email: pendingUser.email,
      fullName: pendingUser.fullName,
      password: pendingUser.password,
      phone: pendingUser.phone,
      status: 'ACTIVE',
      roles: customerRole ? [customerRole] : [],
    });

    const savedUser = await this.userRepository.save(newUser);
    this.otpService.removePendingUser(email);

    const formattedUser = this.formatUserAvatarUrl(savedUser);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = formattedUser;

    return {
      message: 'Xác thực OTP thành công. Tài khoản đã được kích hoạt!',
      user: userWithoutPassword,
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
    try {
      const { email, password } = loginUserDto;

      console.log('[LOGIN] Starting login process:', { email });

      const user = await this.userRepository.findOne({
        where: { email },
        relations: ['roles', 'vipLevel'],
      });

      if (!user) {
        console.warn('[LOGIN] User not found:', { email });
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

      const refreshToken = this.jwtTokenService.generateRefreshToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 giờ

      await this.userRepository.update(
        { id: user.id },
        {
          refreshToken,
          refreshTokenExpiresAt: expiresAt,
        },
      );

      await this.vipService.syncUserVipProgress(user.id);

      const userWithRoles = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.roles', 'role', 'role.name IS NOT NULL')
        .leftJoinAndSelect('user.vipLevel', 'vipLevel')
        .where('user.id = :userId', { userId: user.id })
        .getOne();

      // Định dạng URL ảnh một cách an toàn thông qua bản sao Clone
      const formattedUser = this.formatUserAvatarUrl(userWithRoles ?? user);

      const userResponse: Omit<User, 'password'> = {
        id: formattedUser.id,
        vipLevelId: formattedUser.vipLevelId,
        fullName: formattedUser.fullName,
        email: formattedUser.email,
        phone: formattedUser.phone,
        avatar: formattedUser.avatar,
        status: formattedUser.status,
        totalSpending: formattedUser.totalSpending,
        vipUpdatedAt: formattedUser.vipUpdatedAt,
        createdAt: formattedUser.createdAt,
        roles: userWithRoles?.roles || [],
        vipLevel: formattedUser.vipLevel,
        refreshToken: undefined,
        refreshTokenExpiresAt: undefined,
      };
      return {
        message: 'Đăng nhập thành công',
        user: userResponse,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error('[LOGIN] Error during login:', error);
      throw error;
    }
  }

  /**
   * Bước 4: Refresh Token
   */
  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const { refreshToken } = refreshTokenDto;

      const isFormatValid =
        this.jwtTokenService.verifyRefreshToken(refreshToken);
      if (!isFormatValid) {
        throw new UnauthorizedException('Refresh token không đúng định dạng');
      }

      const user = await this.userRepository.findOne({
        where: { refreshToken },
        select: [
          'id',
          'email',
          'status',
          'refreshToken',
          'refreshTokenExpiresAt',
        ],
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException(
          'Tài khoản không tồn tại hoặc không hoạt động',
        );
      }

      if (
        !user.refreshTokenExpiresAt ||
        new Date() > user.refreshTokenExpiresAt
      ) {
        throw new UnauthorizedException('Refresh token đã hết hạn');
      }

      const newAccessToken = this.jwtTokenService.generateAccessToken(
        user.id,
        user.email,
      );

      const newRefreshToken = this.jwtTokenService.generateRefreshToken();
      const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await this.userRepository.update(
        { id: user.id },
        {
          refreshToken: newRefreshToken,
          refreshTokenExpiresAt: newExpiresAt,
        },
      );

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      console.error('[REFRESH_TOKEN] Error during token refresh:', error);
      throw error;
    }
  }

  /**
   * Bước 5: Logout
   */
  async logoutUser(
    logoutDto: LogoutDto,
    userId: string,
  ): Promise<{ message: string }> {
    try {
      const { refreshToken } = logoutDto;

      if (!refreshToken) {
        throw new BadRequestException('Refresh token không được để trống');
      }

      const isFormatValid =
        this.jwtTokenService.verifyRefreshToken(refreshToken);
      if (!isFormatValid) {
        throw new UnauthorizedException('Refresh token không hợp lệ');
      }

      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'refreshToken'],
      });

      if (!user) {
        throw new UnauthorizedException('User không tồn tại');
      }

      if (user.refreshToken !== refreshToken) {
        throw new UnauthorizedException(
          'Refresh token không khớp với hệ thống',
        );
      }

      await this.userRepository.update(
        { id: userId },
        {
          refreshToken: null,
          refreshTokenExpiresAt: null,
        },
      );

      return { message: 'Đăng xuất thành công' };
    } catch (error) {
      console.error('[LOGOUT] Error during logout:', error);
      throw error;
    }
  }

  /**
   * Yêu cầu reset password
   */
  async requestPasswordReset(
    requestResetDto: RequestPasswordResetDto,
  ): Promise<{ message: string; email: string }> {
    const { email } = requestResetDto;

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('Email này không tồn tại trong hệ thống.');
    }

    await this.otpService.savePasswordResetOtp(email);

    return {
      message: 'OTP reset password đã được gửi tới email của bạn.',
      email,
    };
  }

  /**
   * Reset password thành công
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

    return { message: 'Reset password thành công. Vui lòng đăng nhập lại.' };
  }

  // ========== CÁC HÀM CRUD & PROFILE ==========

  create(createUserDto: CreateUserDto) {
    const newUser = this.userRepository.create(createUserDto);
    return this.userRepository.save(newUser);
  }

  async findAll() {
    const users = await this.userRepository.find({
      relations: ['roles'],
    });
    return users.map((user) => this.formatUserAvatarUrl(user));
  }

  /**
   * Hàm lấy chi tiết User duy nhất theo UUID
   */
  async findOne(id: string): Promise<User> {
    await this.vipService.syncUserVipProgress(id);

    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'vipLevel'],
    });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return this.formatUserAvatarUrl(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.userRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async getProfile(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.findOne(id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  async updateProfile(
    id: string,
    updateDto: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (updateDto.fullName) user.fullName = updateDto.fullName;
    if (updateDto.phone) user.phone = updateDto.phone;
    if (updateDto.avatar) user.avatar = updateDto.avatar;

    const updatedUser = await this.userRepository.save(user);
    const formattedUser = this.formatUserAvatarUrl(updatedUser);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = formattedUser;
    return result;
  }

  /**
   * Cập nhật đường dẫn avatar từ Controller xử lý file
   */
  async updateAvatar(id: string, avatarPath: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    if (avatarPath) {
      user.avatar = avatarPath;
      await this.userRepository.save(user);
    }

    return this.findOne(id);
  }

  async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
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

  async addRoleToUser(userId: string, roleId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });
    if (!user) throw new NotFoundException('User not found');

    const role = await this.roleRepository.findOneBy({
      id: roleId,
      status: 'ACTIVE',
    });
    if (!role) {
      throw new NotFoundException(`Active Role with id ${roleId} not found`);
    }

    const hasRole = user.roles.some((r) => r.id === roleId);
    if (!hasRole) {
      user.roles.push(role);
      await this.userRepository.save(user);
    }
    return this.findOne(userId);
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });
    if (!user) throw new NotFoundException('User not found');

    user.roles = user.roles.filter((r) => r.id !== roleId);
    await this.userRepository.save(user);
    return this.findOne(userId);
  }

  async softDelete(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    user.status = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await this.userRepository.save(user);
    return this.findOne(id);
  }

  remove(id: string) {
    return this.userRepository.delete(id);
  }
}
