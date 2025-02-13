import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './auth/entity/user.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { JwtSecretModule } from './auth/jwt/jwt-secret.module';
import { Post } from './post/entity/post.entity';
import { PostModule } from './post/post.module';
import { JobPostingModule } from './job-posting/job-posting.module';
import { JobPosting } from './job-posting/entity/job-posting.entity';
import { EmploymentType } from './job-posting/entity/employment-type.entity';
import { Location } from './job-posting/entity/location.entity';
import { TeaRating } from './tea-rating/entity/tea-rating.entity';

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
        entities: [User, Post, JobPosting, EmploymentType, Location, TeaRating],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    JwtSecretModule,
    JobPostingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
