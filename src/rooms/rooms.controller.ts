import { Body, Controller, Headers, Post } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from "./dto/create-room.dto";

@Controller('api/v1/rooms')
export class RoomsController {
   constructor(private roomsService: RoomsService) {}

   @Post()
   async createRoom(@Headers('Authorization') auth: string, @Body() data: CreateRoomDto) {
      const result = await this.roomsService.createRoom(auth, data);
      return result;
   }
}
