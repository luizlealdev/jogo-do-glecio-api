import {
   Body,
   Controller,
   Post,
   Res,
   UseGuards,
   Headers,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { RegisterUser, LoginUser } from './dto/user.dto';
import { CatchException } from '../utils/catch-exception';
import { JwtTempStrategy } from './jwt/jwt-temp.strategy';

@Controller('api/v1/auth')
export class AuthController {
   constructor(private readonly authService: AuthService) {}

   exceptionCatcher = new CatchException();

   @Post('local/register')
   async register(@Res() res: Response, @Body() data: RegisterUser) {
      try {
         const user = await this.authService.register(data);

         return res.status(201).json({
            status_code: 201,
            message: 'Usuário criado com sucesso.',
            data: user,
         });
      } catch (err) {
         const exceptionInfo = this.exceptionCatcher.catch(err);

         return res.status(exceptionInfo.status_code).json({
            status_code: exceptionInfo.status_code,
            message: exceptionInfo.message,
         });
      }
   }

   @Post('local/login')
   async login(@Res() res: Response, @Body() data: LoginUser) {
      try {
         const user = await this.authService.login(data);

         return res.status(200).json({
            status_code: 200,
            message: 'Usuário logado com sucesso.',
            data: user,
         });
      } catch (err) {
         const exceptionInfo = this.exceptionCatcher.catch(err);

         return res.status(exceptionInfo.status_code).json({
            status_code: exceptionInfo.status_code,
            message: exceptionInfo.message,
         });
      }
   }

   @Post('password-reset/request')
   async sendCode(@Res() res: Response, @Body() data: any) {
      try {
         await this.authService.sendResetPasswordEmail(data);

         return res.status(200).json({
            status_code: 200,
            message:
               'E-mail enviado com sucesso. Verifique sua caixa de entrada.',
         });
      } catch (err) {
         const exceptionInfo = this.exceptionCatcher.catch(err);

         return res.status(exceptionInfo.status_code).json({
            status_code: exceptionInfo.status_code,
            message: exceptionInfo.message,
         });
      }
   }

   @UseGuards(JwtTempStrategy)
   @Post('password-reset/confirm')
   async resetPassword(
      @Headers('Authorization') auth: string,
      @Res() res: Response,
      @Body() data: any,
   ) {
      try {
         await this.authService.resetPassword(auth, data);

         return res.status(200).json({
            status_code: 200,
            message: 'Senha resetada com sucesso.',
         });
      } catch (err) {
         const exceptionInfo = this.exceptionCatcher.catch(err);

         return res.status(exceptionInfo.status_code).json({
            status_code: exceptionInfo.status_code,
            message: exceptionInfo.message,
         });
      }
   }
}
