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
  ) {}

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

    // Đã đồng bộ chữ async ở OtpService nên gọi await chuẩn cấu trúc bất đồng bộ
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

    // Tìm role 'CUSTOMER' từ bảng roles theo cột role_name
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

    // Loại bỏ password trước khi trả về
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = savedUser;

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

      // Lấy user kèm theo relations để xử lý thông tin phản hồi công khai
      const user = await this.userRepository.findOne({
        where: { email },
        relations: ['roles', 'vipLevel'],
      });

      if (!user) {
        console.warn('[LOGIN] User not found:', { email });
        throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
      }

      console.log('[LOGIN] User found:', {
        userId: user.id,
        email: user.email,
      });

      if (user.status !== 'ACTIVE') {
        console.warn('[LOGIN] Account not active:', {
          userId: user.id,
          status: user.status,
        });
        throw new UnauthorizedException('Tài khoản của bạn không hoạt động');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        console.warn('[LOGIN] Password mismatch:', { email });
        throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
      }

      console.log('[LOGIN] Password verified, generating tokens:', {
        userId: user.id,
      });

      const accessToken = this.jwtTokenService.generateAccessToken(
        user.id,
        user.email,
      );

      const refreshToken = this.jwtTokenService.generateRefreshToken();

      console.log('[LOGIN] Tokens generated:', {
        accessTokenLength: accessToken.length,
        refreshTokenLength: refreshToken.length,
      });

      // Lưu Refresh Token vào User entity với thời hạn 24 giờ
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 giờ
      await this.userRepository.update(
        { id: user.id },
        {
          refreshToken,
          refreshTokenExpiresAt: expiresAt,
        },
      );

      console.log('[LOGIN] Refresh token saved to DB:', {
        userId: user.id,
        expiresAt,
      });

      // Lấy roles sử dụng query builder để chỉ lấy roles hợp lệ (có name không null)
      const userWithRoles = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.roles', 'role', 'role.name IS NOT NULL')
        .where('user.id = :userId', { userId: user.id })
        .getOne();

      const userResponse: Omit<User, 'password'> = {
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
        roles: userWithRoles?.roles || [],
        vipLevel: user.vipLevel,
        refreshToken: undefined,
        refreshTokenExpiresAt: undefined,
      };

      console.log('[LOGIN] Login successful for user:', user.id);

      return {
        message: 'Đăng nhập thành công',
        user: userResponse,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error('[LOGIN] Error during login:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Bước 4: Refresh Token - Nhận diện Opaque Token 64 ký tự trực tiếp dưới DB
   */
  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const { refreshToken } = refreshTokenDto;

      console.log('[REFRESH_TOKEN] Starting token refresh:', {
        tokenLength: refreshToken.length,
      });

      const isFormatValid =
        this.jwtTokenService.verifyRefreshToken(refreshToken);

      if (!isFormatValid) {
        console.warn('[REFRESH_TOKEN] Token format format validation failed');
        throw new UnauthorizedException('Refresh token không đúng định dạng');
      }

      // Tìm kiếm trực tiếp tài khoản sở hữu chuỗi token này trong Database
      // Sử dụng select cụ thể để lấy lên trường refresh_token do entity đã cấu hình ẩn mặt định
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

      console.log('[REFRESH_TOKEN] User lookup result:', {
        found: !!user,
        userId: user?.id,
        status: user?.status,
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException(
          'Tài khoản không tồn tại hoặc không hoạt động',
        );
      }

      // Kiểm tra token đã hết hạn lưu trong bản ghi hay chưa
      if (
        !user.refreshTokenExpiresAt ||
        new Date() > user.refreshTokenExpiresAt
      ) {
        console.warn('[REFRESH_TOKEN] Token has expired');
        throw new UnauthorizedException('Refresh token đã hết hạn');
      }

      const newAccessToken = this.jwtTokenService.generateAccessToken(
        user.id,
        user.email,
      );

      const newRefreshToken = this.jwtTokenService.generateRefreshToken();

      // Lưu token mới vào DB (Xoay vòng token liên tục bảo mật)
      const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Gia hạn thêm 24 giờ
      await this.userRepository.update(
        { id: user.id },
        {
          refreshToken: newRefreshToken,
          refreshTokenExpiresAt: newExpiresAt,
        },
      );

      console.log(
        '[REFRESH_TOKEN] Token refresh successful for user:',
        user.id,
      );

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      console.error('[REFRESH_TOKEN] Error during token refresh:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Bước 5: Logout - hủy Refresh Token
   */
  async logoutUser(
    logoutDto: LogoutDto,
    userId: string,
  ): Promise<{ message: string }> {
    try {
      const { refreshToken } = logoutDto;

      console.log('[LOGOUT] Starting logout process:', {
        userId,
        refreshTokenProvided: !!refreshToken,
      });

      if (!refreshToken) {
        throw new BadRequestException('Refresh token không được để trống');
      }

      const isFormatValid =
        this.jwtTokenService.verifyRefreshToken(refreshToken);

      if (!isFormatValid) {
        throw new UnauthorizedException('Refresh token không hợp lệ');
      }

      // Lấy thông tin user hiện tại từ Database để đối chiếu chuỗi token
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'refreshToken'],
      });

      if (!user) {
        throw new UnauthorizedException('User không tồn tại');
      }

      if (user.refreshToken !== refreshToken) {
        console.warn('[LOGOUT] Token mismatch in DB');
        throw new UnauthorizedException(
          'Refresh token không khớp với token trong hệ thống',
        );
      }

      await this.userRepository.update(
        { id: userId },
        {
          refreshToken: null,
          refreshTokenExpiresAt: null,
        },
      );

      console.log('[LOGOUT] Logout successful for user:', userId);

      return {
        message: 'Đăng xuất thành công',
      };
    } catch (error) {
      console.error('[LOGOUT] Error during logout:', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
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

    // Đã đồng bộ chữ async ở OtpService nên gọi await chuẩn cấu trúc bất đồng bộ
    await this.otpService.savePasswordResetOtp(email);

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
   * Các hàm bổ trợ CRUD có sẵn
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
      relations: ['roles', 'vipLevel'],
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  async updateProfile(
    id: string,
    updateDto: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.findOne(id);

    if (updateDto.fullName) user.fullName = updateDto.fullName;
    if (updateDto.phone) user.phone = updateDto.phone;
    if (updateDto.avatar) user.avatar = updateDto.avatar;

    const updatedUser = await this.userRepository.save(user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = updatedUser;
    return result;
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

  remove(id: string) {
    return this.userRepository.delete(id);
  }
}
