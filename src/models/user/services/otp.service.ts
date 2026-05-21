import { Injectable } from '@nestjs/common';

interface PendingUserData {
  email: string;
  fullName: string;
  password: string;
  phone?: string;
  otp: string;
  otpExpiredAt: Date;
  createdAt: Date;
}

interface PasswordResetOtpData {
  email: string;
  otp: string;
  otpExpiredAt: Date;
  createdAt: Date;
}

interface ActiveRefreshTokenData {
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

@Injectable()
export class OtpService {
  private pendingUsers = new Map<string, PendingUserData>();
  private passwordResetOtps = new Map<string, PasswordResetOtpData>();
  private activeRefreshTokens = new Map<string, ActiveRefreshTokenData>();

  /**
   * Tạo mã OTP 6 chữ số
   */
  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // ========== PENDING USER METHODS ==========

  /**
   * Lưu dữ liệu đăng ký tạm thời với OTP
   */
  savePendingUser(
    email: string,
    fullName: string,
    password: string,
    phone?: string,
  ): string {
    const otp = this.generateOtp();
    const now = new Date();

    this.pendingUsers.set(email, {
      email,
      fullName,
      password,
      phone,
      otp,
      otpExpiredAt: new Date(now.getTime() + 10 * 60 * 1000),
      createdAt: now,
    });

    console.log(`[OTP] Email: ${email}, OTP: ${otp}`);

    return otp;
  }

  /**
   * Xác thực OTP cho đăng ký
   */
  verifyOtp(email: string, otp: string): PendingUserData | null {
    const pending = this.pendingUsers.get(email);

    if (!pending) {
      return null;
    }

    if (new Date() > pending.otpExpiredAt) {
      this.pendingUsers.delete(email);
      return null;
    }

    if (pending.otp !== otp) {
      return null;
    }

    return pending;
  }

  /**
   * Xóa dữ liệu pending sau khi đăng ký thành công
   */
  removePendingUser(email: string): void {
    this.pendingUsers.delete(email);
  }

  /**
   * Kiểm tra pending user có tồn tại không
   */
  hasPendingUser(email: string): boolean {
    return this.pendingUsers.has(email);
  }

  /**
   * Lấy thông tin pending user (để debug)
   */
  getPendingUser(email: string): PendingUserData | undefined {
    return this.pendingUsers.get(email);
  }

  // ========== PASSWORD RESET OTP METHODS ==========

  /**
   * Lưu OTP cho reset password
   */
  savePasswordResetOtp(email: string): string {
    const otp = this.generateOtp();
    const now = new Date();

    this.passwordResetOtps.set(email, {
      email,
      otp,
      otpExpiredAt: new Date(now.getTime() + 10 * 60 * 1000),
      createdAt: now,
    });

    console.log(`[PASSWORD_RESET_OTP] Email: ${email}, OTP: ${otp}`);

    return otp;
  }

  /**
   * Xác thực OTP cho reset password
   */
  verifyPasswordResetOtp(
    email: string,
    otp: string,
  ): PasswordResetOtpData | null {
    const resetOtp = this.passwordResetOtps.get(email);

    if (!resetOtp) {
      return null;
    }

    if (new Date() > resetOtp.otpExpiredAt) {
      this.passwordResetOtps.delete(email);
      return null;
    }

    if (resetOtp.otp !== otp) {
      return null;
    }

    return resetOtp;
  }

  /**
   * Xóa OTP reset password sau khi reset thành công
   */
  removePasswordResetOtp(email: string): void {
    this.passwordResetOtps.delete(email);
  }

  /**
   * Kiểm tra OTP reset password có tồn tại không
   */
  hasPasswordResetOtp(email: string): boolean {
    return this.passwordResetOtps.has(email);
  }

  // ========== REFRESH TOKEN METHODS (MEMORY CACHE) ==========

  /**
   * Lưu Refresh Token hoạt động vào memory cache
   */
  saveRefreshToken(token: string, userId: string, expiresAt: Date): void {
    this.activeRefreshTokens.set(token, {
      userId,
      token,
      expiresAt,
      createdAt: new Date(),
    });

    console.log(`[REFRESH_TOKEN] Token saved for userId: ${userId}`);
  }

  /**
   * Kiểm tra Refresh Token có tồn tại và còn hạn không
   */
  hasRefreshToken(token: string): boolean {
    const tokenData = this.activeRefreshTokens.get(token);

    if (!tokenData) {
      return false;
    }

    // Kiểm tra token đã hết hạn
    if (new Date() > tokenData.expiresAt) {
      this.activeRefreshTokens.delete(token);
      return false;
    }

    return true;
  }

  /**
   * Lấy thông tin Refresh Token
   */
  getRefreshTokenData(token: string): ActiveRefreshTokenData | null {
    const tokenData = this.activeRefreshTokens.get(token);

    if (!tokenData) {
      return null;
    }

    // Kiểm tra token đã hết hạn
    if (new Date() > tokenData.expiresAt) {
      this.activeRefreshTokens.delete(token);
      return null;
    }

    return tokenData;
  }

  /**
   * Xóa Refresh Token (logout)
   */
  removeRefreshToken(token: string): void {
    this.activeRefreshTokens.delete(token);
    console.log(`[REFRESH_TOKEN] Token removed (logout)`);
  }

  /**
   * Xóa tất cả Refresh Token của một user (optional)
   */
  removeAllRefreshTokensByUserId(userId: string): void {
    const tokensToDelete: string[] = [];

    this.activeRefreshTokens.forEach((tokenData, token) => {
      if (tokenData.userId === userId) {
        tokensToDelete.push(token);
      }
    });

    tokensToDelete.forEach((token) => {
      this.activeRefreshTokens.delete(token);
    });

    console.log(
      `[REFRESH_TOKEN] Removed ${tokensToDelete.length} tokens for userId: ${userId}`,
    );
  }

  /**
   * Xóa tất cả expired tokens (có thể chạy cron job định kỳ)
   */
  cleanupExpiredTokens(): number {
    const now = new Date();
    const expiredTokens: string[] = [];

    this.activeRefreshTokens.forEach((tokenData, token) => {
      if (now > tokenData.expiresAt) {
        expiredTokens.push(token);
      }
    });

    expiredTokens.forEach((token) => {
      this.activeRefreshTokens.delete(token);
    });

    console.log(
      `[REFRESH_TOKEN] Cleaned up ${expiredTokens.length} expired tokens`,
    );

    return expiredTokens.length;
  }
}
