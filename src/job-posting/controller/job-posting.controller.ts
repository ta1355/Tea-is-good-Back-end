import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JobPostingService } from '../service/job-posting.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateJobPostingDto } from '../dto/create-job-posting.dto';
import { User } from 'src/auth/entity/user.entity';
import { UpdateJobPostingDto } from '../dto/update-job-posting.dto';
import { handleControllerError } from 'src/common/errors';
import { LocationService } from '../service/location.service';
import { CreateLocationDto } from '../dto/create-location.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateEmploymentTypeDto } from '../dto/create-employment-type.dto';
import { EmploymentTypeService } from '../service/employment-type.service';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('job-posting')
export class JobPostingController {
  constructor(
    private readonly jobPostingService: JobPostingService,
    private readonly locationService: LocationService,
    private readonly employmentTypeService: EmploymentTypeService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR')
  async create(@Body() dto: CreateJobPostingDto, @Req() req: RequestWithUser) {
    try {
      return await this.jobPostingService.createJobPosting(dto, req.user);
    } catch (error: unknown) {
      throw handleControllerError(error, 'Failed to create job-posting');
    }
  }

  @Get()
  async findAll(@Query('page') page: number, @Query('limit') limit: number) {
    try {
      return await this.jobPostingService.getAllJobPostings(page, limit);
    } catch (error: unknown) {
      throw handleControllerError(error, 'Failed to findAll job-posting');
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.jobPostingService.getJobPostingById(+id);
    } catch (error: unknown) {
      throw handleControllerError(error, 'Failed to find one job-posting');
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateJobPostingDto,
    @Req() req: RequestWithUser,
  ) {
    try {
      return await this.jobPostingService.updateJobPosting(+id, dto, req.user);
    } catch (error: unknown) {
      throw handleControllerError(error, 'Failed to update job-posting');
    }
  }

  // 여기서부터 지역 관련 도메인
  @Post('location')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createLocationTag(@Body() dto: CreateLocationDto) {
    try {
      return await this.locationService.createLocationTag(dto);
    } catch (error: unknown) {
      throw handleControllerError(error, 'Faild to create location-tag');
    }
  }

  @Get('location')
  async findAllLocationTag() {
    try {
      console.log('생성 완료');
      return await this.locationService.getAllLocation();
    } catch (error: unknown) {
      throw handleControllerError(error, 'Faild to find-all location-tag');
    }
  }

  @Delete('location/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteLocationTag(@Param('id') id: string) {
    try {
      return await this.locationService.deleteLocation(+id);
    } catch (error: unknown) {
      throw handleControllerError(error, 'Faild to delete location-tag');
    }
  }

  //여기서부터 고용 유형 도메인

  @Post('employment-type')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createEmploymentType(@Body() dto: CreateEmploymentTypeDto) {
    try {
      return await this.employmentTypeService.createEmployment(dto);
    } catch (error: unknown) {
      throw handleControllerError(error, 'Faild to create employment-type');
    }
  }

  @Get('employment-type')
  async findAllEmploymentType() {
    try {
      return this.employmentTypeService.getAllEmploymentType();
    } catch (error) {
      throw handleControllerError(error, 'Faild to findAll employment-type');
    }
  }

  @Delete('employment-type/:id')
  async deleteEmploymentType(@Param('id') id: string) {
    try {
      return this.employmentTypeService.deleteEmploymentType(+id);
    } catch (error: unknown) {
      throw handleControllerError(error, 'Faild to delete employment-type');
    }
  }
}
