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

      return data
   }

   async del(key: string) {
      return this.redis.del(key);
   }
}
