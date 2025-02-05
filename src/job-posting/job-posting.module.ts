import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobPosting } from './entity/job-posting.entity';
import { JobPostingService } from './service/job-posting.service';
import { JobPostingController } from './controller/job-posting.controller';

@Module({
  imports: [TypeOrmModule.forFeature([JobPosting])],
  providers: [JobPostingService],
  controllers: [JobPostingController],
  exports: [JobPostingService],
})
export class JobPostingModule {}
