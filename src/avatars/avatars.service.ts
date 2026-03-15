import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { TokenUtils } from '../utils/token-utils';
import { RedisService } from 'src/redis/redis.service';

const AVATARS_CACHE_TTL = 60 * 60 * 24; // 24 hours

@Injectable()
export class AvatarsService {
   constructor(
      private prisma: PrismaService,
      private redis: RedisService,
      private readonly jwtService: JwtService,
   ) {}

   tokenUtils = new TokenUtils(this.jwtService);

   async getAvatars(): Promise<any> {
      try {
         const cachedAvatars = await this.redis.getJson('avatars');

         if (cachedAvatars) {
            return cachedAvatars;
         }

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

         await this.redis.setJson('avatars', avatars, AVATARS_CACHE_TTL);

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

         const avatar = await this.prisma.avatar.findFirst({
            where: {
               id: Number(id),
               ...(isAdmin ? {} : { is_special: false }),
            },
            select: {
               id: true,
               path_default: true,
               path_256px: true,
               path_128px: true,
            },
         });

         if (!avatar) throw new NotFoundException('Avatar não encontrado.');

         return avatar;
      } catch (err) {
         console.error(err);
         throw err;
      }
   }
}
