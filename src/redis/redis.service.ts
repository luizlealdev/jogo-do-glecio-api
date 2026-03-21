import { Injectable } from '@nestjs/common';
import { Redis } from '@upstash/redis';

@Injectable()
export class RedisService {
   private redis: Redis;

   constructor() {
      this.redis = new Redis({
         url: process.env.UPSTASH_REDIS_REST_URL,
         token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
   }

   async set(key: string, value: any, ex: number = 3600) {
      return this.redis.set(key, value, { ex });
   }

   async get(key: string) {
      return this.redis.get(key);
   }

   async setJson(key: string, value: any, ttl?: number) {
      const payload = JSON.stringify(value);

      if (ttl) {
         return this.redis.set(key, payload, { ex: ttl });
      }

      return this.redis.set(key, payload);
   }

   async getJson<T>(key: string): Promise<T | null> {
      const data = await this.redis.get<T>(key);
      if (!data) return null;

      return data;
   }

   async zadd(key: string, score: number, member: any) {
      return this.redis.zadd(key, { score, member: typeof member === 'object' ? JSON.stringify(member) : member });
   }

   async zrange(
      key: string,
      start: number,
      stop: number,
      options?: { rev?: boolean; withScores?: boolean },
   ) {
      return this.redis.zrange(key, start, stop, options);
   }

   async expire(key: string, seconds: number) {
      return this.redis.expire(key, seconds);
   }

   async exists(key: string) {
      return this.redis.exists(key);
   }

   async del(key: string) {
      return this.redis.del(key);
   }
}
