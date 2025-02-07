import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entity/post.entity';
import { PostService } from './service/post.service';
import { PostController } from './controller/post.controller';
import { PostCleanUpService } from './service/post-clean-up.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [TypeOrmModule.forFeature([Post]), ScheduleModule.forRoot()],
  providers: [PostService, PostCleanUpService],
  controllers: [PostController],
  exports: [PostService],
})
export class PostModule {}
