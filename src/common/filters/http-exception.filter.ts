import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // التقاط أخطاء NestJS القياسية (مثل NotFound, BadRequest)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse: any = exception.getResponse();
      message = exceptionResponse.message || exception.message;
    }
    // التقاط أخطاء تكرار البيانات في MongoDB (Duplicate Key Error)
    else if (exception.code === 11000) {
      status = HttpStatus.CONFLICT;
      const field = Object.keys(exception.keyValue)[0];
      message = `Duplicate value detected for field: ${field}`;
    }
    // التقاط أخطاء التحقق في Mongoose (Validation Error)
    else if (exception.name === 'ValidationError') {
      status = HttpStatus.BAD_REQUEST;
      message = Object.values(exception.errors)
        .map((err: any) => err.message)
        .join(', ');
    }

    const request = ctx.getRequest<any>();
    const origin = request.headers?.origin || '*';

    response.header('Access-Control-Allow-Origin', origin);
    response.header('Access-Control-Allow-Credentials', 'true');
    response.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Requested-With, Origin');
    response.header('Access-Control-Allow-Methods', 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS');

    response.status(status).json({
      success: false,
      statusCode: status,
      message: message,
      timestamp: new Date().toISOString(),
    });
  }
}
