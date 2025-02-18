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
import { User } from 'src/auth/entity/user.entity';
import { MagazineService } from '../service/magazine.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateMagazineDto } from '../dto/create-magazine.dto';
import { handleControllerError } from 'src/common/errors';
import { UpdateMagazineDto } from '../dto/update-magazine.dto';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('magazine')
export class MagazineController {
  constructor(private readonly magazineService: MagazineService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR')
  async create(@Body() dto: CreateMagazineDto, @Req() req: RequestWithUser) {
    try {
      return await this.magazineService.createMagazine(dto, req.user);
    } catch (error: unknown) {
      throw handleControllerError(error, 'Failed to create magazine');
    }
  }

  @Get()
  async findAll(@Query('page') page: number, @Query('limit') limit: number) {
    try {
      return await this.magazineService.getAllMagazine(page, limit);
    } catch (error: unknown) {
      throw handleControllerError(error, 'Faild to fetch magazine');
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.magazineService.getMagazineById(+id);
    } catch (error: unknown) {
      throw handleControllerError(error, 'Faild to fetch magazine detail');
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMagazineDto,
    @Req() req: RequestWithUser,
  ) {
    try {
      return await this.magazineService.updateMagazine(+id, dto, req.user);
    } catch (error: unknown) {
      throw handleControllerError(error, 'Faild to update magazine');
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR')
  async remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    try {
      return await this.magazineService.deletedMagazine(+id, req.user);
    } catch (error: unknown) {
      throw handleControllerError(error, 'Faild to remove magazine');
    }
  }
}
