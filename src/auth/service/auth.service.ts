import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entity/user.entity';
import { LoginUserDto } from '../dto/login-user.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { JwtSecretService } from '../jwt/jwt-secret.service';
import * as bcrypt from 'bcryptjs';

type SafeUser = Omit<
  User,
  | 'userPassword'
  | 'hashPassword'
  | 'validatePassword'
  | 'softDelete'
  | 'isDeleted'
  | 'isActive'
>;

interface UserPayload {
  userEmail: string;
  indexId: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private jwtSecretService: JwtSecretService,
  ) {}

  async signUp(createUserDto: CreateUserDto): Promise<User> {
    const { userName, userPassword, userEmail, role } = createUserDto;
    try {
      const existingUser = await this.usersRepository.findOne({
        where: { userEmail },
      });

      if (existingUser) {
        throw new ConflictException('Email is already in use.');
      }

      const hashedPassword = await bcrypt.hash(userPassword, 10);

      const user = this.usersRepository.create({
        userName,
        userPassword: hashedPassword,
        userEmail,
        role,
      });

      return await this.usersRepository.save(user);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`회원가입 실패 : ${error.message}`);
      } else {
        this.logger.error('회원가입 실패 알 수 없는 오류입니다.');
      }
      throw new Error('회원가입을 실패했습니다.');
    }
  }

  async validateUser(loginUserDto: LoginUserDto): Promise<SafeUser> {
    const { userEmail, userPassword } = loginUserDto;
    try {
      const user = await this.usersRepository.findOne({ where: { userEmail } });
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
      const isPasswordValid = await bcrypt.compare(
        userPassword,
        user.userPassword,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const safeUser: SafeUser = {
        indexId: user.indexId,
        userName: user.userName,
        userEmail: user.userEmail,
        role: user.role,
        createDateTime: user.createDateTime,
        deletedDateTime: user.deletedDateTime,
        posts: user.posts,
      };
      return safeUser;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`유저인증 실패: ${error.message}`);
      } else {
        this.logger.error('유저인증 실패: 알 수 없는 오류');
      }
      throw new Error('Faild to validate user');
    }
  }

  login(user: UserPayload) {
    const payload = { userEmail: user.userEmail, sub: user.indexId };
    return {
      access_token: this.jwtService.sign(payload, {
        secret: this.jwtSecretService.getHashedSecret(),
      }),
    };
  }
}
