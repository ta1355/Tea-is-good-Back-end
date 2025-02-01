import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthService } from 'src/auth/service/auth.service';
import { LoginUserDto } from 'src/auth/dto/login-user.dto';
import { User } from 'src/auth/entity/user.entity';

type SafeUser = Omit<
  User,
  | 'userPassword'
  | 'hashPassword'
  | 'validatePassword'
  | 'softDelete'
  | 'isDeleted'
  | 'isActive'
>;

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  private readonly logger = new Logger(LocalStrategy.name);

  constructor(private authService: AuthService) {
    //임시
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      usernameField: 'userEmail',
      passwordField: 'userPassword',
    });
  }

  async validate(userEmail: string, userPassword: string): Promise<SafeUser> {
    try {
      const loginUserDto: LoginUserDto = { userEmail, userPassword };
      const user = await this.authService.validateUser(loginUserDto);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
      return user;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`인증 실패: ${error.message}}`);
      } else {
        this.logger.error('인증 실패: 알 수 없는 오류');
      }
      throw new Error('Authentication failed');
    }
  }
}
