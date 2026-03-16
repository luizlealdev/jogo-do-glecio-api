import {
   Body,
   Controller,
   Put,
   Headers,
   UseGuards,
   Get,
   Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt.auth.guard';
import { UserService } from './user.service';
import { UpdatePaswordUser, UpdateUser } from './dto/user-updates.dto';

@Controller('api/v1/user')
export class UserController {
   constructor(private readonly userService: UserService) {}


   @Get(':id')
   @UseGuards(JwtAuthGuard)
   async getUser(@Param('id') userId) {
      const user = await this.userService.getUser(Number(userId));
      return user;
   }

   @Put('update')
   @UseGuards(JwtAuthGuard)
   async updateUser(
      @Headers('Authorization') auth: string,
      @Body() data: UpdateUser,
   ) {
      const user = await this.userService.updateUser(auth, data);
      return user;
   }

   @Put('update/password')
   @UseGuards(JwtAuthGuard)
   async updateUserPassword(
      @Headers('Authorization') auth: string,
      @Body() data: UpdatePaswordUser,
   ) {
      await this.userService.updateUserPassword(auth, data);

      return {
         message: 'Senha do usuário atualizada com sucesso.',
      };
   }
}
