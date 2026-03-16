import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BigIntInterceptor } from './common/interceptors/bigint.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
   const app = await NestFactory.create(AppModule);

   //num entendi foi nada, mas resolveu meu erro. Isso é o bastante
   (BigInt.prototype as any).toJSON = function () {
      return this.toString();
   };

   app.useGlobalInterceptors(new BigIntInterceptor());
   app.useGlobalInterceptors(new ResponseInterceptor());

   app.useGlobalFilters(new HttpExceptionFilter());

   app.enableCors({
      origin: '*',
      methods: 'GET,POST,PUT,DELETE',
      credentials: true,
      allowedHeaders:
         'Origin, Authorization, X-Requested-With, Content-Type, Accept, Authentication, Access-control-allow-credentials, Access-control-allow-headers, Access-control-allow-methods, Access-control-allow-origin, User-Agent, Referer, Accept-Encoding, Accept-Language, Access-Control-Request-Headers, Cache-Control, Pragma',
   });

   await app.listen(3000);
}
bootstrap();
