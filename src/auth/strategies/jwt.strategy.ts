import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtSecretService } from '../jwt/jwt-secret.service';

interface JwtPayload {
  indexId: number;
  userEmail: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtSecretService: JwtSecretService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecretService.getHashedSecret(),
    });
  }

  validate(payload: JwtPayload): JwtPayload | undefined {
    try {
      if (!payload.indexId || !payload.userEmail) {
        throw new UnauthorizedException('Invalid token payload');
      }
      return payload;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`JWT 토큰 인증 실패 : ${error.message}`);
      } else {
        this.logger.error('JWT 토큰 인증 실패 : 알 수 없는 오류 ');
      }
      throw error;
    }
  }
}
