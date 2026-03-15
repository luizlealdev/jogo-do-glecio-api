import {
   BadRequestException,
   Injectable,
   NotFoundException,
   UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { RegisterUser, LoginUser } from './dto/user.dto';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { TokenUtils } from 'src/utils/token-utils';

@Injectable()
export class AuthService {
   constructor(
      private readonly prisma: PrismaService,
      private jwtService: JwtService,
      private readonly userService: UserService,
      private mailService: MailService,
   ) {}

   tokenUtils = new TokenUtils(this.jwtService);

   async register(data: RegisterUser): Promise<any> {
      try {
         const createUser = new RegisterUser();
         createUser.name = data.name;
         createUser.email = data.email;
         createUser.course_id = data.course_id;
         createUser.password = await bcrypt.hash(data.password, 10);
         createUser.avatar_id = data.avatar_id;

         const user = await this.userService.createUser(createUser);

         return {
            user: {
               id: user.id,
               name: user.name,
               course_id: user.course_id,
               course: user.course,
               avatar_id: user.avatar_id,
               avatar: user.avatar,
               is_admin: user.is_admin,
            },
            access_token: this.jwtService.sign({
               sub: user.id,
               email: user.email,
            }),
         };
      } catch (err) {
         console.error(err);
         throw err;
      }
   }

   async login(data: LoginUser): Promise<any> {
      try {
         const user = await this.prisma.user.findUnique({
            where: {
               email: data.email,
            },
            include: {
               avatar: {
                  select: {
                     path_default: true,
                     path_256px: true,
                     path_128px: true,
                  },
               },
               course: {
                  select: {
                     name: true,
                  },
               },
            },
         });

         if (!user)
            throw new NotFoundException(
               'O usuário com este não foi encontrado.',
            );

         const passwordMatches = await bcrypt.compare(
            data.password,
            user.password,
         );

         if (!passwordMatches)
            throw new UnauthorizedException('Senha incorreta. Tente novamente');

         return {
            user: {
               id: user.id,
               name: user.name,
               course_id: user.course_id,
               course: user.course,
               avatar_id: user.avatar_id,
               avatar: user.avatar,
               max_score: user.max_score,
               is_admin: user.is_admin,
            },
            access_token: this.jwtService.sign({
               sub: Number(user.id),
               email: (await user).email,
            }),
         };
      } catch (err) {
         console.error(err);
         throw err;
      }
   }

   async sendResetPasswordEmail(data: any): Promise<any> {
      try {
         if (!data.email)
            throw new BadRequestException('O campo email é obrigatório.');

         const user = await this.prisma.user.findUnique({
            where: {
               email: data.email,
            },
            select: {
               id: true,
               email: true,
               name: true,
            },
         });

         if (user) {
            const payload = { sub: user.id, email: user.email };
            const tempJwtToken = this.jwtService.sign(payload, {
               expiresIn: '5m',
               secret: process.env.JWT_TEMP_SECRET,
            });

            await this.mailService.sendResetPasswordEmail(
               data.email,
               user.name,
               tempJwtToken,
            );
         }
      } catch (err) {
         console.error(err);
         throw err;
      }
   }

   async resetPassword(auth: string, data: any): Promise<any> {
      try {
         if (!data.new_password)
            throw new BadRequestException('O campo "senha" é obrigatório.');

         const decodedToken = this.tokenUtils.getDecodedToken(auth);

         const user = await this.prisma.user.findUnique({
            where: {
               id: decodedToken.sub,
               email: decodedToken.email,
            },
         });

         if (!user) new UnauthorizedException('O usuário não foi encontrado.');

         const newPassword = await bcrypt.hash(data.new_password, 10);

         await this.prisma.user.update({
            where: {
               email: decodedToken.email,
               id: decodedToken.sub,
            },
            data: {
               password: newPassword,
            },
         });
      } catch (err) {
         console.error(err);
         throw err;
      }
   }
}
