import { Controller, Get, Param, Res, Headers } from '@nestjs/common';
import { Response } from 'express';
import { AvatarsService } from './avatars.service';
import { join } from 'path';

@Controller('api')
export class AvatarsController {
   constructor(private avatarsService: AvatarsService) {}

   @Get('/v1/avatars/all')
   async getAvatars() {
      const avatars = await this.avatarsService.getAvatars();
      return avatars;
   }

    @Get('/v1/avatars')
   async getAvatarsV2() {
      const avatars = await this.avatarsService.getAvatars();
      return avatars;
   }

   @Get('/v1/avatars/id/:id')
   async getSpecificAvatar(
      @Headers('Authorization') auth: string,
      @Param('id') id,
   ) {
      const avatar = await this.avatarsService.getSpecificAvatar(id, auth);
      return avatar;
   }

   @Get('/v1/avatars/:id')
   async getSpecificAvatarV2(
      @Headers('Authorization') auth: string,
      @Param('id') id,
   ) {
      const avatar = await this.avatarsService.getSpecificAvatar(id, auth);
      return avatar;
   }

   @Get('/v1/avatars/:size/:id')
   async getAvatarImage(
      @Param('size') size,
      @Param('id') id,
      @Res() res: Response,
   ) {
      return res.sendFile(
         join(
            process.cwd(),
            `uploads/images/avatars/${size}/avatar_${id}.webp`,
         ),
      );
   }
}
