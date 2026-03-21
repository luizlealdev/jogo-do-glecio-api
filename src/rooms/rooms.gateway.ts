import { Injectable, Logger } from '@nestjs/common';
import {
   WebSocketGateway,
   WebSocketServer,
   SubscribeMessage,
   OnGatewayConnection,
   OnGatewayDisconnect,
   ConnectedSocket,
   MessageBody,
} from '@nestjs/websockets';
import { RoomsService } from './rooms.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { IncomingMessage } from 'http';
import { WebSocket, Server } from 'ws';

@WebSocketGateway({ cors: true }) // Permite conexão de outros domínios (Front-end)
@Injectable()
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
   @WebSocketServer()
   server: Server;

   private readonly logger = new Logger(RoomsGateway.name);
   private rooms: Map<string, Set<WebSocket>> = new Map();
   private connectedUsers: Map<WebSocket, any> = new Map();

   constructor(
      private roomsService: RoomsService,
      private jwtService: JwtService,
      private userService: UserService,
   ) {}

   async handleConnection(client: WebSocket, request: IncomingMessage) {
      try {
         const host = request.headers.host || 'localhost';
         const url = new URL(request.url, `http://${host}`);
         const token = url.searchParams.get('token');

         if (!token) throw new Error('Token ausente');

         const payload = await this.jwtService.verifyAsync(token);
         const user = await this.userService.getUser(payload.sub);

         if (!user) throw new Error('Usuário não encontrado');

         const userData = {
            id: payload.sub,
            name: user.name,
            course: user.course.name,
            avatar: user.avatar?.path_128px || null,
         };

         this.connectedUsers.set(client, userData);

         this.logger.log(
            `Authenticated user: ${userData.name} from ${userData.course}`,
         );
      } catch (error) {
         this.logger.error(`Connection failed: ${error.message}`);
         client.close(1008, 'Não autorizado');
      }
   }

   handleDisconnect(client: WebSocket) {
      this.connectedUsers.delete(client);

      this.rooms.forEach((clients, roomId) => {
         if (clients.has(client)) {
            clients.delete(client);

            if (clients.size === 0) {
               this.rooms.delete(roomId);
            }

            this.logger.log(`Client disconnected from room ${roomId}`);
         }
      });
   }

   @SubscribeMessage('joinRoom')
   async handleJoinRoom(
      @ConnectedSocket() client: WebSocket,
      @MessageBody() data: { roomId: string },
   ) {
      try {
         const roomExists = await this.roomsService.roomExists(data.roomId);
         if (!roomExists) {
            return { event: 'error', data: { message: 'Sala não encontrada' } };
         }

         if (!this.rooms.has(data.roomId)) {
            this.rooms.set(data.roomId, new Set());
         }
         this.rooms.get(data.roomId).add(client);

         this.logger.log(`Client joined room ${data.roomId}`);

         const usersInRoom = this.getUsersInRoom(data.roomId);

         this.broadcastToRoom(data.roomId, 'userJoined', usersInRoom);

         return { event: 'roomJoined', data: usersInRoom };
      } catch (error) {
         return { event: 'error', data: { message: 'Erro ao entrar na sala' } };
      }
   }

   @SubscribeMessage('leaveRoom')
   async leaveRoom(
      @ConnectedSocket() client: WebSocket,
      @MessageBody() data: { roomId: string },
   ) {
      const roomClients = this.rooms.get(data.roomId)
      if (roomClients) {
         roomClients.delete

         if (roomClients.size === 0) {
            this.rooms.delete(data.roomId)
         } else {
            const remainMembers = this.getUsersInRoom(data.roomId)
            this.broadcastToRoom(data.roomId, 'roomJoined', remainMembers)
         }

         this.logger.log(`Client left room ${data.roomId}`)
      }
   }

   @SubscribeMessage('startMatch')
   async startMatch(
      @ConnectedSocket() client: WebSocket,
      @MessageBody() data: {roomId: string}
   ) {
      
   }

   @SubscribeMessage('submitScore')
   async handleSubmitScore(
      @ConnectedSocket() client: WebSocket,
      @MessageBody() data: { roomId: string; score: number },
   ) {
      const user = this.connectedUsers.get(client);

      if (!user) {
         return {
            event: 'error',
            data: { message: 'Usuário não autenticado' },
         };
      }

      this.logger.log(`Score submitted by: ${user.name}`);

      try {
         await this.roomsService.saveScore(data.roomId, user, data.score);
         const updatedRanking = await this.roomsService.getRanking(data.roomId);

         // Envia para TODOS os membros da sala (broadcast)
         this.broadcastToRoom(data.roomId, 'rankingUpdated', updatedRanking);
      } catch (error) {
         this.logger.error('Erro submitting data:', error);
         return {
            event: 'error',
            data: { message: 'Falha ao salvar pontos, tente novamente' },
         };
      }
   }

   private broadcastToRoom(roomId: string, event: string, data: any) {
      const clients = this.rooms.get(roomId);
      if (clients) {
         // O WsAdapter padrão do Nest exige essa estrutura de payload
         const payload = JSON.stringify({ event, data });
         clients.forEach((c) => {
            if (c.readyState === WebSocket.OPEN) {
               c.send(payload);
            }
         });
      }
   }

   private getUsersInRoom(roomId: string): any[] {
      const clients = this.rooms.get(roomId);
      if (!clients) return [];

      const users = [];
      clients.forEach((client) => {
         const userData = this.connectedUsers.get(client);
         if (userData) {
            users.push(userData);
         }
      });

      return users;
   }
}
