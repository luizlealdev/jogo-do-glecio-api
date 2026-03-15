import { Controller, Get, Param, Res, Headers } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { Response } from 'express';

@Controller('api/v1/courses')
export class CoursesController {
   constructor(private coursesService: CoursesService) {}

   @Get('all')
   async getAvatars(
      @Headers('Authorization') auth: string,
   ) {
      const courses = await this.coursesService.getCourses(auth);
      return courses;
   }

   @Get('id/:id')
   async getSpecificCourse(
      @Headers('Authorization') auth: string,
      @Param('id') id,
   ) {
      const course = await this.coursesService.getSpecificCourse(id, auth);
      course;
   }
}
