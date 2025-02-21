import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entity/user.entity';
import { LoginUserDto } from '../dto/login-user.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { withErrorHandling } from 'src/common/errors';

export type SafeUser = Omit<
  User,
  'userPassword' | 'softDelete' | 'isDeleted' | 'isActive'
>;

export type SafeUserWithIds = Omit<
  SafeUser,
  'posts' | 'jobPostings' | 'teaRatings' | 'magazines'
> & {
  posts: number[];
  jobPostings: number[];
  teaRatings: number[];
  magazines: number[];
};

interface UserPayload {
  userEmail: string;
  indexId: number;
  role: UserRole;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  private toSafeUser(user: User): SafeUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { userPassword, ...safeUser } = user;
    return safeUser;
  }

  async signUp(createUserDto: CreateUserDto): Promise<SafeUser> {
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

      const savedUser = await this.usersRepository.save(user);
      return this.toSafeUser(savedUser);
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

      return this.toSafeUser(user);
    });
  }

  async login(user: SafeUser): Promise<{ access_token: string }> {
    const payload: UserPayload = {
      indexId: user.indexId,
      userEmail: user.userEmail,
      role: user.role,
    };

    const access_token = await this.jwtService.signAsync(payload);
    return { access_token };
  }

  async deleteUser(user: SafeUser): Promise<void> {
    return withErrorHandling(
      this.logger,
      '유저 계정 삭제(소프트)',
    )(async () => {
      const currentUser = await this.usersRepository.findOne({
        where: { indexId: user.indexId },
      });

      if (!currentUser) {
        throw new NotFoundException('User not found');
      }

      if (currentUser.deletedDateTime) {
        throw new ConflictException('User is already deleted');
      }

      if (user.indexId !== currentUser.indexId) {
        throw new UnauthorizedException('You can only delete your account');
      }

      currentUser.deletedDateTime = new Date();

      await this.usersRepository.save(currentUser);
    });
  }

  async updateUserRole(indexId: number, newRole: UserRole): Promise<SafeUser> {
    return withErrorHandling(
      this.logger,
      `유저 역할 ${newRole}로 업데이트`,
    )(async () => {
      const existingUser = await this.usersRepository.findOne({
        where: { indexId },
      });
      if (!existingUser) {
        throw new NotFoundException(`User with indexId ${indexId} not found`);
      }

      if (existingUser.role === newRole) {
        throw new ConflictException('User role is already up to date');
      }

      if (existingUser.role === UserRole.ADMIN || newRole === UserRole.ADMIN) {
        throw new ConflictException('Cannot update admin role');
      }

      existingUser.role = newRole;

      const updatedUser = await this.usersRepository.save(existingUser);
      return this.toSafeUser(updatedUser);
    });
  }

  async getAllUsers(): Promise<SafeUserWithIds[]> {
    return withErrorHandling(
      this.logger,
      '모든 유저 조회',
    )(async () => {
      const users = await this.usersRepository.find({
        relations: ['posts', 'jobPostings', 'teaRatings', 'magazines'],
      });

      return users.map((user) => ({
        ...this.toSafeUser(user),
        posts: user.posts?.map((post) => post.indexId) || [],
        jobPostings: user.jobPostings?.map((posting) => posting.indexId) || [],
        teaRatings: user.teaRatings?.map((rating) => rating.indexId) || [],
        magazines: user.magazines?.map((magazine) => magazine.indexId) || [],
      }));
    });
  }
}
