import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { env } from '../../config/env.config';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'An unexpected internal server error occurred.';

    // Log the error securely with all context
    const logDetails = {
      path: request.url,
      method: request.method,
      status,
      timestamp: new Date().toISOString(),
      stack: exception instanceof Error ? exception.stack : JSON.stringify(exception),
    };

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[CRITICAL API FAILURE] Path: ${logDetails.method} ${logDetails.path} - Status: ${status} - Error: ${logDetails.stack}`
      );
    } else {
      this.logger.warn(
        `[API Exception] Path: ${logDetails.method} ${logDetails.path} - Status: ${status} - Details: ${JSON.stringify(message)}`
      );
    }

    // Prepare secure response payload
    const responsePayload: any = {
      statusCode: status,
      timestamp: logDetails.timestamp,
      path: logDetails.path,
    };

    if (exception instanceof HttpException) {
      // If it is a NestJS built-in validation or client error, return the details safely
      const rawMsg: any = exception.getResponse();
      if (typeof rawMsg === 'object') {
        responsePayload.message = rawMsg.message || rawMsg;
      } else {
        responsePayload.message = rawMsg;
      }
    } else {
      // In production, we mask raw exceptions to avoid exposing stack trace details
      responsePayload.message = 'Internal Server Error';
    }

    // In development mode, we can expose structural issues for debugging
    if (env.NODE_ENV === 'development' && status === HttpStatus.INTERNAL_SERVER_ERROR) {
      responsePayload.developmentStack = exception instanceof Error ? exception.stack : exception;
    }

    response.status(status).json(responsePayload);
  }
}
