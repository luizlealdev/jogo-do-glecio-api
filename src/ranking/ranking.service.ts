import {
   BadRequestException,
   Injectable,
   UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RankingEntry } from './dto/ranking-entry.dto';
import { JwtService } from '@nestjs/jwt';
import { TokenUtils } from '../utils/token-utils';
import { RedisService } from '../redis/redis.service';

const RANKING_CACHE_TTL = 60 * 60;

@Injectable()
export class RankingService {
   constructor(
      private prisma: PrismaService,
      private redis: RedisService,
      private readonly jwtService: JwtService,
   ) {}

   tokenUtils = new TokenUtils(this.jwtService);

   /* NORMAL RANKING */

   async getAllRankingEntries(): Promise<any> {
      try {
         const cache = await this.redis.getJson('rankingEntries');

         if (cache) {
            console.info('[RankingService]: returning cached ranking');
            return cache;
         }

         const rankingEntries = await this.prisma.ranking.findMany({
            orderBy: {
               score: 'desc',
            },
            take: 60,
            select: {
               id: true,
               score: true,
               user: {
                  select: {
                     id: true,
                     name: true,
                     course_id: true,
                     course: {
                        select: {
                           name: true,
                        },
                     },
                     avatar_id: true,
                     avatar: {
                        select: {
                           path_128px: true,
                        },
                     },
                  },
               },
            },
         });

         await this.redis.setJson(
            'rankingEntries',
            rankingEntries,
            RANKING_CACHE_TTL,
         );

         console.log(await this.redis.getJson('rankingEntries'));

         return rankingEntries;
      } catch (err) {
         console.error(err);
         throw err;
      }
   }

   /* GLOBAL RANKING */

   async getAllGlobalRankEntries(): Promise<any> {
      const cache = await this.redis.getJson('globalRankingEntries');

      if (cache) {
         console.info('[RankingService]: returning cached global ranking');
         return cache;
      }

      const rankingEntries = await this.prisma.ranking_global.findMany({
         orderBy: {
            score: 'desc',
         },
         take: 99,
         select: {
            id: true,
            score: true,
            user: {
               select: {
                  id: true,
                  name: true,
                  course_id: true,
                  course: {
                     select: {
                        name: true,
                     },
                  },
                  avatar_id: true,
                  avatar: {
                     select: {
                        path_128px: true,
                     },
                  },
               },
            },
         },
      });

      await this.redis.setJson(
         'globalRankingEntries',
         rankingEntries,
         RANKING_CACHE_TTL,
      );

      return rankingEntries;
   }

   /* SET SCORE */

   async setRankingEntry(auth: string, data: RankingEntry): Promise<any> {
      if (data.score < 0) throw new BadRequestException('Score inválido.');

      const decodedToken = this.tokenUtils.getDecodedToken(auth);
      const userId = decodedToken.sub;

      const newRankingEntry = await this.prisma.ranking.upsert({
         where: { user_id: userId },
         update: { score: data.score },
         create: { user_id: userId, score: data.score },
         select: {
            score: true,
            user_id: true,
            user: { select: { max_score: true } },
         },
      });

      this.updateGlobalStatsAndCache(
         userId,
         data.score,
         newRankingEntry.user.max_score ?? 0,
      ).catch((err) => console.error('[RankingService Background Task]:', err));

      return newRankingEntry;
   }

   private async updateGlobalStatsAndCache(
      userId: number,
      newScore: number,
      currentMaxScore: number,
   ) {
      try {
         const promises: Promise<any>[] = [this.redis.del('rankingEntries')];

         if (newScore > currentMaxScore) {
            console.log('[RankingService]: updating global ranking');

            promises.push(
               this.prisma.ranking_global.upsert({
                  where: { user_id: userId },
                  update: { score: newScore },
                  create: { user_id: userId, score: newScore },
               }),
               this.prisma.user.update({
                  where: { id: userId },
                  data: { max_score: newScore },
               }),
               this.redis.del('globalRankingEntries'),
            );
         }

         await Promise.all(promises);
      } catch (error) {
         console.error(
            '[RankingService]: Error updating global stats or cache:',
            error,
         );
      }
   }

   /* RESET RANK */

   async resetNormalRank(auth: string) {
      try {
         const decodedToken = this.tokenUtils.getDecodedToken(auth);

         const admin = await this.prisma.user.findFirst({
            where: {
               email: decodedToken.email,
            },
         });

         if (!admin || !admin.is_admin)
            throw new UnauthorizedException(
               'Você não tem permissão para acessar este recurso.',
            );

         
         await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE ranking;`);

         await this.redis.del('rankingEntries');
      } catch (err) {
         console.error('[RankingService]:', err);
         throw err;
      }
   }
}
