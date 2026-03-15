import { Controller, Get, Param, Res, Headers } from '@nestjs/common';
import { Response } from 'express';
import { AvatarsService } from './avatars.service';
import { join } from 'path';

@Controller('api/v1/avatars')
export class AvatarsController {
   constructor(private avatarsService: AvatarsService) {}

   @Get()
   async getAvatars() {
      const avatars = await this.avatarsService.getAvatars();
      return avatars;
   }

   @Get(':id')
   async getSpecificAvatar(
      @Headers('Authorization') auth: string,
      @Param('id') id,
   ) {
      const avatar = await this.avatarsService.getSpecificAvatar(id, auth);
      return avatar;
   }

   @Get(':size/:id')
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
