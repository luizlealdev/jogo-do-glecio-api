import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { customAlphabet } from 'nanoid';
import { TokenUtils } from 'src/utils/token-utils';
import { JwtService } from '@nestjs/jwt';
import { CreateRoomDto } from './dto/create-room.dto';

export interface UserData {
   id: string;
   name: string;
   avatar: string;
   course: string;
}

const ROOM_RANKING_TTL = 60 * 60 * 24;

@Injectable()
export class RoomsService {
   private readonly logger = new Logger(RoomsService.name);
   private tokenUtils: TokenUtils;
   private generateCode = customAlphabet(
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      5,
   );

   constructor(
      private redis: RedisService,
      private jwtService: JwtService,
   ) {
      this.tokenUtils = new TokenUtils(this.jwtService);
   }

   async createRoom(auth: string, data: CreateRoomDto): Promise<any> {
      try {
         const decodedToken = this.tokenUtils.getDecodedToken(auth);
         const userId = decodedToken.sub;
         const code = this.generateCode();
         const redisKey = `room:${code}:metadata`;

         await this.redis.set(
            redisKey,
            JSON.stringify({ host: userId, createdAt: Date.now(), ...data }),
            ROOM_RANKING_TTL,
         );

         return { code };
      } catch (error) {
         this.logger.error('Erro ao criar sala:', error);
         throw error;
      }
   }

   async getRoomMetadata(roomId: string): Promise<any> {
      const redisKey = `room:${roomId}:metadata`;

      return this.redis.getJson(redisKey);
   }

   async saveScore(roomId: string, userData: UserData, score: number) {
      const redisKey = `room:${roomId}:ranking`;

      const memberPayload = JSON.stringify({
         id: userData.id,
         name: userData.name,
         avatar: userData.avatar,
         course: userData.course,
      });

      await this.redis.zadd(redisKey, score, memberPayload);
      await this.redis.expire(redisKey, ROOM_RANKING_TTL);
   }

   async roomExists(roomId: string): Promise<boolean> {
      const roomKey = `room:${roomId}:metadata`;
      const result = await this.redis.exists(roomKey);
      return result === 1;
   }

   async getRanking(roomId: string): Promise<any[]> {
      const redisKey = `room:${roomId}:ranking`;

      const results = await this.redis.zrange(redisKey, 0, -1, {
         rev: true,
         withScores: true,
      });

      if (!results || !Array.isArray(results) || results.length === 0) {
         return [];
      }

      const ranking = [];

      for (let i = 0; i < results.length; i += 2) {
         const member = results[i];
         const score = results[i + 1];

         if (member) {
            try {
               const userData =
                  typeof member === 'string' ? JSON.parse(member) : member;

               ranking.push({
                  ...userData,
                  score: score,
               });
            } catch (error) {
               this.logger.error(
                  `Erro ao processar membro no índice ${i}:`,
                  error,
               );
            }
         }
      }

      return ranking;
   }
}
