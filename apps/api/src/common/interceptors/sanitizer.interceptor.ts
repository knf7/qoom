import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { InputSanitizer } from '@qoom/security';

@Injectable()
export class SanitizerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    if (request) {
      if (request.body) {
        request.body = this.sanitizeObject(request.body);
      }
      if (request.query) {
        request.query = this.sanitizeObject(request.query);
      }
      if (request.params) {
        request.params = this.sanitizeObject(request.params);
      }
    }
    return next.handle();
  }

  /**
   * Recursively traverses and sanitizes nested string fields inside JSON objects
   */
  private sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      if (typeof obj === 'string') {
        return InputSanitizer.sanitizeText(obj);
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = this.sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
}
