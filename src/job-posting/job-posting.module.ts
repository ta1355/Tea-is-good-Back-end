import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobPosting } from './entity/job-posting.entity';
import { JobPostingService } from './service/job-posting.service';
import { JobPostingController } from './controller/job-posting.controller';
import { LocationService } from './service/location.service';
import { Location } from './entity/location.entity';
import { EmploymentType } from './entity/employment-type.entity';
import { EmploymentTypeService } from './service/employment-type.service';

@Module({
  imports: [TypeOrmModule.forFeature([JobPosting, Location, EmploymentType])],
  providers: [JobPostingService, LocationService, EmploymentTypeService],
  controllers: [JobPostingController],
  exports: [JobPostingService, LocationService, EmploymentTypeService],
})
export class JobPostingModule {}
