import {
   Body,
   Controller,
   Post,
   UseGuards,
   Headers,
   HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUser, LoginUser } from './dto/user.dto';
import { JwtTempStrategy } from './jwt/jwt-temp.strategy';

@Controller('api/v1/auth')
export class AuthController {
   constructor(private readonly authService: AuthService) {}

   @Post('local/register')
   async register(@Body() data: RegisterUser) {
      const user = await this.authService.register(data);
      return user;
   }

   @Post('local/login')
   @HttpCode(200)
   async login(@Body() data: LoginUser) {
      const user = await this.authService.login(data);
      return user;
   }

   @Post('password-reset/request')
   @HttpCode(200)
   async sendCode(@Body() data: any) {
      await this.authService.sendResetPasswordEmail(data);

      return {
         message: 'E-mail enviado com sucesso. Verifique sua caixa de entrada.',
      };
   }

   @UseGuards(JwtTempStrategy)
   @Post('password-reset/confirm')
   @HttpCode(200)
   async resetPassword(
      @Headers('Authorization') auth: string,
      @Body() data: any,
   ) {
      await this.authService.resetPassword(auth, data);

      return {
         message: 'Senha resetada com sucesso.',
      };
   }
}