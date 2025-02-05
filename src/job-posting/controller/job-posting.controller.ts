import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JobPostingService } from '../service/job-posting.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateJobPostingDto } from '../dto/create-job-posting.dto';
import { User } from 'src/auth/entity/user.entity';

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
      throw this.handleError(error, 'Failed to create job-posting');
    }
  }

  private handleError(error: unknown, defaultMessage: string) {
    if (error instanceof HttpException) {
      return error;
    }
    return new InternalServerErrorException({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: defaultMessage,
      details:
        error instanceof Error ? error.message : 'Unkoown error occurred',
    });
  }
}
