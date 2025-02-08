import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobPosting } from './entity/job-posting.entity';
import { JobPostingService } from './service/job-posting.service';
import { JobPostingController } from './controller/job-posting.controller';
import { LocationService } from './service/location.service';
import { Location } from './entity/location.entity';

@Module({
  imports: [TypeOrmModule.forFeature([JobPosting, Location])],
  providers: [JobPostingService, LocationService],
  controllers: [JobPostingController],
  exports: [JobPostingService, LocationService],
})
export class JobPostingModule {}
