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
import {
  AuthService,
  SafeUser,
  SafeUserWithIds,
} from '../service/auth.service';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CreateUserDto } from '../dto/create-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { UserRole } from '../entity/user.entity';

interface RequestWithUser extends Request {
  user: SafeUser;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() createUserDto: CreateUserDto): Promise<SafeUser> {
    return await this.authService.signUp(createUserDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Req() req: RequestWithUser,
  ): Promise<{ access_token: string }> {
    return await this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: RequestWithUser): SafeUser {
    return req.user;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('USER')
  @Delete('account-deletion')
  accountDeletion(@Req() req: RequestWithUser): Promise<void> {
    return this.authService.deleteUser(req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('upgrade-role/:id')
  upgradeUserRole(@Param('id') indexId: string): Promise<SafeUser> {
    return this.authService.updateUserRole(+indexId, UserRole.EDITOR);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('downgrade-role/:id')
  downgradeUserRole(@Param('id') indexId: string): Promise<SafeUser> {
    return this.authService.updateUserRole(+indexId, UserRole.USER);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('all-user-find')
  findAllUser(): Promise<SafeUserWithIds[]> {
    return this.authService.getAllUsers();
  }
}
