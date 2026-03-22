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
import { UserService } from '../user/user.service';
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
      const roomClients = this.rooms.get(data.roomId);
      if (roomClients) {
         roomClients.delete;

         if (roomClients.size === 0) {
            this.rooms.delete(data.roomId);
         } else {
            const remainMembers = this.getUsersInRoom(data.roomId);
            this.broadcastToRoom(data.roomId, 'roomJoined', remainMembers);
         }

         this.logger.log(`Client left room ${data.roomId}`);
      }
   }

   @SubscribeMessage('startMatch')
   async startMatch(
      @ConnectedSocket() client: WebSocket,
      @MessageBody() data: { roomId: string },
   ) {
      const user = await this.waitForUser(client);
      const roomMetadata = await this.roomsService.getRoomMetadata(data.roomId);

      if (user.id != roomMetadata.host) {
         return {
            event: 'error',
            data: { message: 'Usuário não autorizado' },
         };
      }

      this.broadcastToRoom(data.roomId, 'startMatch', {
         config: roomMetadata.config,
         operations: this.generateOperations(roomMetadata.config),
      });
   }

   @SubscribeMessage('submitScore')
   async handleSubmitScore(
      @ConnectedSocket() client: WebSocket,
      @MessageBody() data: { roomId: string; score: number },
   ) {
      const user = await this.waitForUser(client);

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

   private async waitForUser(client: WebSocket, timeout = 1000) {
      const start = Date.now();

      while (!this.connectedUsers.get(client)) {
         if (Date.now() - start > timeout) return null;
         await new Promise((res) => setTimeout(res, 10));
      }

      return this.connectedUsers.get(client);
   }

   private generateOperations(config: {
      time: number;
      operations: ('all' | 'sum' | 'sub' | 'mult' | 'div')[];
   }) {
      const possibilityNumbers = '123456789';

      const divPossibilityNumbers: Record<number, number[]> = {
         2: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
         3: [3, 6, 9, 12, 15, 18, 21, 24, 27],
         4: [4, 8, 12, 16, 20, 24, 28, 32, 36],
      };

      const subPossibilityNumbers = {
         first: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
         second: [1, 2, 3, 4, 5, 6, 7],
      };

      let operationsList = [];
      const totalIterations = config.time * 3;

      for (let i = 0; i < totalIterations; i++) {
         const allowedTypes = config.operations;
         let type =
            allowedTypes[Math.floor(Math.random() * allowedTypes.length)];

         if (type === 'all') {
            const percentage = Math.floor(Math.random() * 10) + 1;
            if (percentage <= 6)
               type = 'mult'; // 60%
            else if (percentage <= 8)
               type = 'sum'; // 20%
            else if (percentage === 9)
               type = 'div'; // 10%
            else type = 'sub'; // 10%
         }

         let opData: any = null;

         switch (type) {
            case 'mult': {
               const m1 = this.selectRandomCharacter(possibilityNumbers);
               const m2 = this.selectRandomCharacter(possibilityNumbers);
               opData = {
                  firstNum: Number(m1),
                  secondNum: Number(m2),
                  result: Number(m1) * Number(m2),
                  symbol: '×',
               };
               break;
            }

            case 'sum': {
               const s1 = this.selectRandomCharacter(possibilityNumbers);
               const s2 = this.selectRandomCharacter(possibilityNumbers);
               opData = {
                  firstNum: Number(s1),
                  secondNum: Number(s2),
                  result: Number(s1) + Number(s2),
                  symbol: '+',
               };
               break;
            }

            case 'div': {
               const divisors = [2, 3, 4];
               const divisor =
                  divisors[Math.floor(Math.random() * divisors.length)];
               const dividends = divPossibilityNumbers[divisor];
               const dividend =
                  dividends[Math.floor(Math.random() * dividends.length)];
               opData = {
                  firstNum: dividend,
                  secondNum: divisor,
                  result: dividend / divisor,
                  symbol: '÷',
               };
               break;
            }

            case 'sub': {
               const sub1 =
                  subPossibilityNumbers.first[
                     Math.floor(
                        Math.random() * subPossibilityNumbers.first.length,
                     )
                  ];
               const sub2 =
                  subPossibilityNumbers.second[
                     Math.floor(
                        Math.random() * subPossibilityNumbers.second.length,
                     )
                  ];
               opData = {
                  firstNum: sub1,
                  secondNum: sub2,
                  result: sub1 - sub2,
                  symbol: '-',
               };
               break;
            }
         }

         if (opData) {
            operationsList.push({ ...opData, type });
         }
      }

      return operationsList;
   }

   private selectRandomCharacter = (str: string) => {
      return str[Math.floor(Math.random() * str.length)];
   };
}
