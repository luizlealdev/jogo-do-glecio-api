import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { TokenUtils } from '../utils/token-utils';
import { RedisService } from '../redis/redis.service';

const COURSES_CACHE_TTL = 60 * 60 * 24; // 24 hours

@Injectable()
export class CoursesService {
   constructor(
      private prisma: PrismaService,
      private redis: RedisService,
      private readonly jwtService: JwtService,
   ) {}

   tokenUtils = new TokenUtils(this.jwtService);

   async getCourses(auth: string): Promise<any> {
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

         const cachedCourses = await this.redis.getJson('courses');

         if (!isAdmin && cachedCourses) {
            return cachedCourses;
         }

         const courses = await this.prisma.course.findMany({
            where: {
               is_active: true,
               ...(isAdmin ? {} : { is_special: false }),
            },
            orderBy: {
               name: 'asc',
            },
         });

         if (!isAdmin) {
            await this.redis.setJson('courses', courses, COURSES_CACHE_TTL);
         }

         return courses;
      } catch (err) {
         console.error(err);
         throw err;
      }
   }

   async getSpecificCourse(id: string, auth: string): Promise<any> {
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

         const course = await this.prisma.course.findFirst({
            where: {
               id: BigInt(id),
               is_active: true,
               ...(isAdmin ? {} : { is_special: false }),
            },
            orderBy: {
               name: 'asc',
            },
         });

         if (!course)
            throw new NotFoundException('Turma ou curso não encontrado');

         return course;
      } catch (err) {
         console.error(err);
         throw err;
      }
   }
}
