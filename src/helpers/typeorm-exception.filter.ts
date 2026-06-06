import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Mặc định nếu không phân loại được thì trả về 400 hoặc 500
    let status = HttpStatus.BAD_REQUEST;
    let message = exception.message;

    // Bắt các mã lỗi đặc trưng của PostgreSQL
    switch (exception.code) {
      case '23503': // Lỗi Khóa ngoại (Foreign Key Violation) - Đúng lỗi bạn đang gặp
        status = HttpStatus.BAD_REQUEST;
        message = exception.detail; // 🟢 Lấy câu "Key (category_id)=... is not present..."
        break;

      case '23505': // Lỗi Trùng dữ liệu (Unique Violation)
        status = HttpStatus.CONFLICT;
        message = exception.detail;
        break;

      default:
        // Nếu là các lỗi query khác, lấy detail nếu có, không thì lấy message gốc
        message = exception.detail || exception.message;
        break;
    }

    response.status(status).json({
      statusCode: status,
      message: message,
      error: 'Database Error',
    });
  }
}
