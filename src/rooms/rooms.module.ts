import { Module } from '@nestjs/common';
import { RoomsGateway } from './rooms.gateway';
import { RoomsService } from './rooms.service';
import { UserModule } from "src/user/user.module";
import { RedisModule } from "src/redis/redis.module";
import { RoomsController } from "./rooms.controller";

@Module({
   imports: [UserModule, RedisModule],
   providers: [RoomsGateway, RoomsService],
   controllers: [RoomsController],
})
export class RoomsModule {}
