import {
   Body,
   Controller,
   Put,
   Headers,
   Res,
   UseGuards,
   Get,
   Param,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt/jwt.auth.guard';
import { CatchException } from 'src/utils/catch-exception';
import { UserService } from './user.service';
import { UpdatePaswordUser, UpdateUser } from './dto/user-updates.dto';

@Controller('api/v1/user')
export class UserController {
   constructor(private readonly userService: UserService) {}

   exceptionCatcher = new CatchException();

   @Get(':id')
   @UseGuards(JwtAuthGuard)
   async getUser(@Param('id') userId, @Res() res: Response) {
      try {
         const user = await this.userService.getUser(Number(userId));

         return res.status(200).json({
            status_code: 200,
            message: 'Informações do usuário consultadas com sucesso.',
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

   @Put('update')
   @UseGuards(JwtAuthGuard)
   async updateUser(
      @Res() res: Response,
      @Headers('Authorization') auth: string,
      @Body() data: UpdateUser,
   ) {
      try {
         const user = await this.userService.updateUser(auth, data);

         return res.status(200).json({
            status_code: 200,
            message: 'Informações do usuário atualizadas com sucesso.',
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

   @Put('update/password')
   @UseGuards(JwtAuthGuard)
   async updateUserPassword(
      @Res() res: Response,
      @Headers('Authorization') auth: string,
      @Body() data: UpdatePaswordUser,
   ) {
      try {
         await this.userService.updateUserPassword(auth, data);

         return res.status(200).json({
            status_code: 200,
            message: 'Senha do usuário atualizada com sucesso.',
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
