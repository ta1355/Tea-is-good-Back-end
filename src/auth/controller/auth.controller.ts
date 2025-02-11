import {
  Controller,
  Post,
  UseGuards,
  Req,
  Get,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../service/auth.service';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CreateUserDto } from '../dto/create-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';
import { User } from '../entity/user.entity';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() createUserDto: CreateUserDto) {
    return await this.authService.signUp(createUserDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto, @Req() req: RequestWithUser) {
    return await this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: RequestWithUser): User {
    return req.user;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('USER')
  @Delete('account-deletion')
  accountDeletion(@Req() req: RequestWithUser) {
    return this.authService.deleteUser(req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('upgrade-role/:id')
  upgradeUserRole(@Param('id') indexId: string) {
    return this.authService.upgradeUserRole(+indexId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('downgrade-role/:id')
  downgradeUserRole(@Param('id') indexId: string) {
    return this.authService.downgradeUserRole(+indexId);
  }
}
