import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/auth/entity/user.entity';
import { AuthService } from './service/auth.service';
import { AuthController } from './controller/auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtSecretService } from './jwt/jwt-secret.service';
import { JwtSecretModule } from './jwt/jwt-secret.module';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtSecretModule,
    JwtModule.registerAsync({
      imports: [JwtSecretModule, ConfigModule],
      useFactory: (
        jwtSecretService: JwtSecretService,
        configService: ConfigService,
      ) => ({
        secret:
          jwtSecretService.getHashedSecret() ||
          configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [JwtSecretService, ConfigService],
    }),
    TypeOrmModule.forFeature([User]),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
