import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeaRating } from './entity/tea-rating.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TeaRating])],
  providers: [],
  controllers: [],
  exports: [],
})
export class TeaRatingModule {}
