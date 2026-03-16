import {
   ExceptionFilter,
   Catch,
   ArgumentsHost,
   HttpException,
   HttpStatus,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
   catch(exception: unknown, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse();

      let status = HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Erro interno no servidor.';

      if (exception instanceof HttpException) {
         status = exception.getStatus();
         const res = exception.getResponse() as any;
         message = res?.message || exception.message;
      }

      response.status(status).json({
         status_code: status,
         message,
         data: null,
      });
   }
}
