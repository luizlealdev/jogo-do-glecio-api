import {
   Body,
   Controller,
   Delete,
   Get,
   Post,
   UseGuards,
   Headers,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt/jwt.auth.guard';
import { RankingService } from './ranking.service';
import { RankingEntry } from './dto/ranking-entry.dto';

@Controller('api/v1/ranking')
export class RankingController {
   constructor(private rankingService: RankingService) {}

   @UseGuards(JwtAuthGuard)
   @Get('normal')
   async getAllRankingEntries() {
      const entries = await this.rankingService.getAllRankingEntries();
      return entries;
   }

   @UseGuards(JwtAuthGuard)
   @Get('global')
   async getAllGlobalRankingEntries() {
      const entries = await this.rankingService.getAllGlobalRankEntries();
      return entries;
   }

   @UseGuards(JwtAuthGuard)
   @Post()
   async setRankingEntry(
      @Headers('Authorization') auth: string,
      @Body() data: RankingEntry,
   ) {
      const entry = await this.rankingService.setRankingEntry(auth, data);
      return entry;
   }

   @UseGuards(JwtAuthGuard)
   @Delete()
   async resetNormalRank(@Headers('Authorization') auth: string) {
      await this.rankingService.resetNormalRank(auth);
      return null;
   }
}
