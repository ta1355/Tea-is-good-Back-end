import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtSecretService } from '../jwt/jwt-secret.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entity/user.entity';
import { Repository } from 'typeorm';

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
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecretService.getHashedSecret(),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    try {
      if (!payload.indexId || !payload.userEmail) {
        throw new UnauthorizedException('잘못된 토큰 페이로드');
      }

      const user = await this.userRepository.findOne({
        where: { indexId: payload.indexId },
      });

      if (!user) {
        throw new UnauthorizedException('존재하지 않는 사용자');
      }

      return payload;
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        this.logger.warn(`인증 실패: ${error.message}`);
        throw error;
      }

      if (error instanceof Error) {
        this.logger.error(`심각한 인증 오류: ${error.message}`, error.stack);
        throw new UnauthorizedException('내부 서버 오류');
      }

      this.logger.error('알 수 없는 인증 오류 발생');
      throw new UnauthorizedException('알 수 없는 오류');
    }
  }
}
