import { Module } from '@nestjs/common';
import { JwtSecretService } from './jwt-secret.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [JwtSecretService],
  exports: [JwtSecretService],
})
export class JwtSecretModule {}
