import {
   Injectable,
   NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { TokenUtils } from '../utils/token-utils';

const AVATARS_CACHE_TTL = 60 * 60 * 24; // 24 hours

@Injectable()
export class AvatarsService {
   constructor(
      private prisma: PrismaService,
      private readonly jwtService: JwtService,
   ) {}

   tokenUtils = new TokenUtils(this.jwtService);

   async getAvatars(): Promise<any> {
      try {
         const avatars = await this.prisma.avatar.findMany({
            where: {
               is_special: false,
            },
            select: {
               id: true,
               path_default: true,
               path_256px: true,
               path_128px: true,
            },
         });

         return avatars;
      } catch (err) {
         console.error(err);
         throw err;
      }
   }

   async getSpecificAvatar(id: string, auth: string) {
      try {
         const decodedToken = this.tokenUtils.getDecodedToken(auth || '');

         const isAdmin = decodedToken?.sub
            ? !!(
                 await this.prisma.user.findUnique({
                    where: { id: decodedToken.sub },
                    select: { is_admin: true },
                 })
              )?.is_admin
            : false;

         let avatar;

         if (isAdmin) {
            avatar = await this.prisma.avatar.findMany({
               where: {
                  id: Number(id),
               },
               select: {
                  id: true,
                  path_default: true,
                  path_256px: true,
                  path_128px: true,
               },
            });
         } else {
            avatar = await this.prisma.avatar.findMany({
               where: {
                  id: Number(id),
                  is_special: false,
               },
               select: {
                  id: true,
                  path_default: true,
                  path_256px: true,
                  path_128px: true,
               },
            });
         }

         console.log(avatar);

         if (avatar.length === 0)
            throw new NotFoundException('Avatar não encontrado.');

         return avatar;
      } catch (err) {
         console.error(err);
         throw err;
      }
   }
}
