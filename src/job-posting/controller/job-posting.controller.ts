import {
  Body,
  Controller,
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

interface RequestWithUser extends Request {
  user: User;
}

@Controller('job-posting')
export class JobPostingController {
  constructor(private readonly jobPostingService: JobPostingService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
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
}
