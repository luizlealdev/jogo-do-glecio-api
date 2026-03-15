import {
   CallHandler,
   ExecutionContext,
   Injectable,
   NestInterceptor,
   HttpStatus,
} from '@nestjs/common';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
   intercept(context: ExecutionContext, next: CallHandler) {
      const response = context.switchToHttp().getResponse();

      return next.handle().pipe(
         map((data) => ({
            status_code: response.statusCode || HttpStatus.OK,
            message: 'Sucesso',
            data: data ?? null,
         })),
      );
   }
}
