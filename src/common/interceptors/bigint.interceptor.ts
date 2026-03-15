import {
   CallHandler,
   ExecutionContext,
   Injectable,
   NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs/operators';

function convertBigInt(data: any): any {
   if (typeof data === 'bigint') {
      return data.toString();
   }

   if (Array.isArray(data)) {
      return data.map(convertBigInt);
   }

   if (data && typeof data === 'object') {
      const obj: any = {};
      for (const key in data) {
         obj[key] = convertBigInt(data[key]);
      }
      return obj;
   }

   return data;
}

@Injectable()
export class BigIntInterceptor implements NestInterceptor {
   intercept(context: ExecutionContext, next: CallHandler) {
      return next.handle().pipe(map((data) => convertBigInt(data)));
   }
}
