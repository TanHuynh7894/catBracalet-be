import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';

export interface PendingUserData {
  email: string;
  fullName: string;
  password: string;
  phone?: string;
}

interface OtpData {
  otp: string;
  expiresAt: Date;
}

@Injectable()
export class OtpService implements OnModuleInit {
  private readonly logger = new Logger(OtpService.name);
  private pendingUsers = new Map<string, PendingUserData>();
  private registerOtps = new Map<string, OtpData>();
  private passwordResetOtps = new Map<string, OtpData>();
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.initTransporter();
  }

  private async initTransporter() {
    const host =
      this.configService.get<string>('MAIL_HOST') || 'smtp.gmail.com';
    const portRaw = this.configService.get<string>('MAIL_PORT');
    const port = portRaw ? parseInt(portRaw, 10) : 587;
    const secureRaw = this.configService.get<string>('MAIL_SECURE');
    const secure =
      typeof secureRaw === 'string' ? secureRaw === 'true' : port === 465;

    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASSWORD');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
      tls: {
        rejectUnauthorized: false,
      },
      logger: process.env.NODE_ENV !== 'production',
      debug: process.env.NODE_ENV !== 'production',
    });

    try {
      await this.transporter.verify();
      this.logger.log('=== [SUCCESS] Kết nối đến Server Gmail thành công! ===');
    } catch (err) {
      this.logger.error('=== [ERROR] Kết nối Gmail thất bại! ===', err);
    }

    if (!user || !pass) {
      this.logger.warn('MAIL_USER or MAIL_PASSWORD is not set. Check .env');
    }
  }

  private generateOtpCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  hasPendingUser(email: string): boolean {
    return this.pendingUsers.has(email);
  }

  private ensureTransporter() {
    if (!this.transporter) {
      throw new Error('Mail transporter is not initialized');
    }
    return this.transporter;
  }

  async savePendingUser(
    email: string,
    fullName: string,
    passwordHashed: string,
    phone?: string,
  ): Promise<void> {
    this.pendingUsers.set(email, {
      email,
      fullName,
      password: passwordHashed,
      phone,
    });

    const otp = this.generateOtpCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    this.registerOtps.set(email, { otp, expiresAt });

    const mailFrom =
      this.configService.get<string>('MAIL_FROM') ||
      this.configService.get<string>('MAIL_USER');
    const systemName =
      this.configService.get<string>('APP_NAME') ?? 'Hệ Thống Vòng Tay';

    try {
      const transporter = this.ensureTransporter();
      const info = await transporter.sendMail({
        from: `"${systemName}" <${mailFrom}>`,
        to: email,
        subject: 'Mã OTP Xác Thực Đăng Ký Tài Khoản',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h3 style="color: #333;">Xin chào ${fullName},</h3>
            <p>Cảm ơn bạn đã đăng ký tài khoản. Mã OTP kích hoạt của bạn là:</p>
            <div style="background: #f4f4f4; padding: 15px; text-align: center; border-radius: 4px;">
              <h2 style="color: #4CAF50; letter-spacing: 4px; margin: 0; font-size: 30px;">${otp}</h2>
            </div>
            <p style="color: #666; font-size: 13px; margin-top: 15px;">Mã này có hiệu lực trong vòng <b>5 phút</b>. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
          </div>
        `,
      });

      this.logger.log(`Email sent to ${email}. messageId=${info.messageId}`);
    } catch (error) {
      this.logger.error(
        '[OTP_SERVICE] Failed to send registration OTP email',
        error,
      );
      this.removePendingUser(email);
      throw error;
    }
  }

  verifyOtp(email: string, otp: string): PendingUserData | null {
    const otpData = this.registerOtps.get(email);
    if (!otpData) return null;

    if (new Date() > otpData.expiresAt) {
      this.removePendingUser(email);
      return null;
    }

    if (otpData.otp !== otp) return null;

    return this.pendingUsers.get(email) || null;
  }

  removePendingUser(email: string): void {
    this.pendingUsers.delete(email);
    this.registerOtps.delete(email);
  }

  async savePasswordResetOtp(email: string): Promise<void> {
    const otp = this.generateOtpCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    this.passwordResetOtps.set(email, { otp, expiresAt });

    const mailFrom =
      this.configService.get<string>('MAIL_FROM') ||
      this.configService.get<string>('MAIL_USER');
    const systemName =
      this.configService.get<string>('APP_NAME') ?? 'Hệ Thống Vòng Tay';

    try {
      const transporter = this.ensureTransporter();
      const info = await transporter.sendMail({
        from: `"${systemName}" <${mailFrom}>`,
        to: email,
        subject: 'Yêu Cầu Đặt Lại Mật Khẩu',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h3 style="color: #333;">Yêu cầu đặt lại mật khẩu</h3>
            <p>Chúng tôi nhận được yêu cầu cấp lại mật khẩu cho tài khoản của bạn. Mã OTP reset là:</p>
            <div style="background: #f4f4f4; padding: 15px; text-align: center; border-radius: 4px;">
              <h2 style="color: #FF5722; letter-spacing: 4px; margin: 0; font-size: 30px;">${otp}</h2>
            </div>
            <p style="color: #666; font-size: 13px; margin-top: 15px;">Mã có hiệu lực trong 5 phút.</p>
          </div>
        `,
      });

      this.logger.log(
        `Password reset email sent to ${email}. messageId=${info.messageId}`,
      );
    } catch (error) {
      this.logger.error(
        '[OTP_SERVICE] Failed to send password reset email',
        error,
      );
      this.passwordResetOtps.delete(email);
      throw error;
    }
  }

  verifyPasswordResetOtp(email: string, otp: string): boolean {
    const otpData = this.passwordResetOtps.get(email);
    if (!otpData) return false;

    if (new Date() > otpData.expiresAt) {
      this.passwordResetOtps.delete(email);
      return false;
    }

    return otpData.otp === otp;
  }

  removePasswordResetOtp(email: string): void {
    this.passwordResetOtps.delete(email);
  }
}
