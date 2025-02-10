import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeaRating } from './entity/tea-rating.entity';
import { TeaRatingSerivce } from './service/tea-rating.service';
import { TeaRatingController } from './controller/tea-rating.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TeaRating])],
  providers: [TeaRatingSerivce],
  controllers: [TeaRatingController],
  exports: [TeaRatingSerivce],
})
export class TeaRatingModule {}
