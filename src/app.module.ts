import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppService } from './app.service';
import { User } from './auth/entity/user.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { JwtSecretModule } from './auth/jwt/jwt-secret.module';
import { Post } from './post/entity/post.entity';
import { PostModule } from './post/post.module';
import { JobPostingController } from './job-posting/controller/job-posting.controller';
import { JobPostingService } from './job-posting/service/job-posting.service';
import { JobPostingModule } from './job-posting/job-posting.module';

@Module({
  imports: [
    PostModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
        type: configService.get('DB_TYPE') as 'mysql',
        host: configService.get('DB_HOST') as string,
        port: +configService.get('DB_PORT')!, //+는 문자열을 숫자열로
        username: configService.get('DB_USERNAME') as string,
        password: configService.get('DB_PASSWORD') as string,
        database: configService.get('DB_DATABASE') as string,
        entities: [User, Post],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    JwtSecretModule,
    JobPostingModule,
  ],
  controllers: [AppController, JobPostingController],
  providers: [AppService, JobPostingService],
})
export class AppModule {}
