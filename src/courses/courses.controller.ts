import { Controller, Get, Param, Res, Headers } from '@nestjs/common';
import { CoursesService } from './courses.service';

@Controller('api/v1/courses')
export class CoursesController {
   constructor(private coursesService: CoursesService) {}

   @Get()
   async getCourses(
      @Headers('Authorization') auth: string,
   ) {
      const courses = await this.coursesService.getCourses(auth);
      return courses;
   }

   @Get(':id')
   async getSpecificCourse(
      @Headers('Authorization') auth: string,
      @Param('id') id,
   ) {
      const course = await this.coursesService.getSpecificCourse(id, auth);
      return course;
   }
}
