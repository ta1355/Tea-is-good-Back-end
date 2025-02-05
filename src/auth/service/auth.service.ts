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
import * as bcrypt from 'bcryptjs';
import { withErrorHandling } from 'src/common/errors';

type SafeUser = Omit<
  User,
  | 'userPassword'
  | 'hashPassword'
  | 'validatePassword'
  | 'softDelete'
  | 'isDeleted'
  | 'isActive'
  | 'jobPostings'
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
  ) {}

  async signUp(createUserDto: CreateUserDto): Promise<User> {
    return withErrorHandling(
      this.logger,
      '회원가입',
    )(async () => {
      const { userName, userPassword, userEmail, role } = createUserDto;

      const existingUser = await this.usersRepository.findOne({
        where: { userEmail },
      });

      if (existingUser) {
        throw new ConflictException('이미 사용 중인 이메일입니다');
      }

      const hashedPassword = await bcrypt.hash(userPassword, 10);

      const user = this.usersRepository.create({
        userName,
        userPassword: hashedPassword,
        userEmail,
        role,
      });

      return await this.usersRepository.save(user);
    });
  }

  async validateUser(loginUserDto: LoginUserDto): Promise<SafeUser> {
    return withErrorHandling(
      this.logger,
      '사용자 인증',
    )(async () => {
      const { userEmail, userPassword } = loginUserDto;
      const user = await this.usersRepository.findOne({
        where: { userEmail },
      });

      if (!user) {
        throw new UnauthorizedException('유효하지 않은 인증 정보입니다');
      }

      const isPasswordValid = await bcrypt.compare(
        userPassword,
        user.userPassword,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('유효하지 않은 인증 정보입니다');
      }

      return {
        indexId: user.indexId,
        userName: user.userName,
        userEmail: user.userEmail,
        role: user.role,
        createDateTime: user.createDateTime,
        deletedDateTime: user.deletedDateTime,
        posts: user.posts,
      };
    });
  }

  login(user: UserPayload) {
    const payload = { indexId: user.indexId, userEmail: user.userEmail };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
