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

    let status = HttpStatus.BAD_REQUEST;
    let message = exception.message;

    switch (exception.code) {
      case '23503':
        status = HttpStatus.BAD_REQUEST;
        message = exception.detail; 
        break;

      case '23505': 
        status = HttpStatus.CONFLICT;
        message = exception.detail;
        break;

      default:
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
