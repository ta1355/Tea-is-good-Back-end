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
import { TeaRatingSerivce } from '../service/tea-rating.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateTeaRatingDto } from '../dto/create-tea-rating.dto';
import { User } from 'src/auth/entity/user.entity';
import { handleControllerError } from 'src/common/errors';
import { UpdateTeaRatingDto } from '../dto/update-tea-rating.dto';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('tea-rating')
export class TeaRatingController {
  constructor(private readonly teaRatingService: TeaRatingSerivce) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR')
  async create(@Body() dto: CreateTeaRatingDto, @Req() req: RequestWithUser) {
    try {
      return await this.teaRatingService.createTeaRating(dto, req.user);
    } catch (error: unknown) {
      throw handleControllerError(error, 'Failed to create tea-rating');
    }
  }

  @Get()
  async findAll(@Query('page') page: number, @Query('limit') limit: number) {
    try {
      return await this.teaRatingService.getAllTeaRating(page, limit);
    } catch (error: unknown) {
      throw handleControllerError(error, 'Faild to fetch tea-rating');
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.teaRatingService.getTeaRatingById(+id);
    } catch (error: unknown) {
      throw handleControllerError(error, 'Faild to fetch tea-rating');
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTeaRatingDto,
    @Req() req: RequestWithUser,
  ) {
    try {
      return await this.teaRatingService.updateTeaRating(+id, dto, req.user);
    } catch (error: unknown) {
      throw handleControllerError(error, 'Faild to update tea-rating');
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR')
  async remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    try {
      return this.teaRatingService.deleteTeaRating(+id, req.user);
    } catch (error: unknown) {
      throw handleControllerError(error, 'Faild to remove tea-rating');
    }
  }
}
