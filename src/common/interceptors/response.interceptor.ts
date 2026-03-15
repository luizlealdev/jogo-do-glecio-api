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
         map((data) => {
            if (data?.message) {
               return {
                  status_code: response.statusCode,
                  message: data.message,
                  data: data.data ?? null,
               };
            }

            return {
               status_code: response.statusCode,
               message: 'Sucesso',
               data: data ?? null,
            };
         }),
      );
   }
}
