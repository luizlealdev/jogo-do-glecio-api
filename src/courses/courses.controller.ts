import { Controller, Get, Param, Res, Headers } from '@nestjs/common';
import { CoursesService } from './courses.service';

@Controller('api')
export class CoursesController {
   constructor(private coursesService: CoursesService) {}

   @Get('/v1/courses')
   async getCourses(@Headers('Authorization') auth: string) {
      const courses = await this.coursesService.getCourses(auth);
      return courses;
   }

   @Get('/v2/courses/:id')
   async getSpecificCourse(
      @Headers('Authorization') auth: string,
      @Param('id') id,
   ) {
      const course = await this.coursesService.getSpecificCourse(id, auth);
      return course;
   }

   @Get('/v2/courses/id/:id')
   async getSpecificCourseV2(
      @Headers('Authorization') auth: string,
      @Param('id') id,
   ) {
      const course = await this.coursesService.getSpecificCourse(id, auth);
      return course;
   }
}
