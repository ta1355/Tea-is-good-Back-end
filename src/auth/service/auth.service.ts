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
  role: string;
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

  async login(user: User): Promise<{ access_token: string }> {
    const payload: UserPayload = {
      indexId: user.indexId,
      userEmail: user.userEmail,
      role: user.role,
    };

    const access_token = await this.jwtService.signAsync(payload);
    return { access_token };
  }

  async deleteUser(user: User): Promise<void> {
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

      if (currentUser.isDeleted()) {
        throw new ConflictException('User is already deleted');
      }

      if (user.indexId !== currentUser.indexId) {
        throw new UnauthorizedException('You can only delete your account');
      }

      currentUser.softDelete();

      await this.usersRepository.save(currentUser);
    });
  }

  async upgradeUserRole(indexId: number): Promise<SafeUser> {
    return withErrorHandling(
      this.logger,
      '유저 역할 EDITOR로 업데이트',
    )(async () => {
      const existingUser = await this.usersRepository.findOne({
        where: { indexId },
      });
      if (!existingUser) {
        throw new NotFoundException(`User with indexId ${indexId} not found`);
      }

      if (existingUser.role === UserRole.EDITOR) {
        throw new ConflictException('User role is already updated');
      }

      if (existingUser.role === UserRole.ADMIN) {
        throw new ConflictException('can not update this user');
      }

      existingUser.role = UserRole.EDITOR;

      const updatedUser = await this.usersRepository.save(existingUser);

      const safeUser: SafeUser = {
        indexId: updatedUser.indexId,
        userName: updatedUser.userName,
        userEmail: updatedUser.userEmail,
        role: updatedUser.role,
        createDateTime: updatedUser.createDateTime,
        deletedDateTime: updatedUser.deletedDateTime,
        posts: updatedUser.posts,
      };
      return safeUser;
    });
  }

  async downgradeUserRole(indexId: number): Promise<SafeUser> {
    return withErrorHandling(
      this.logger,
      '유저 역할 USER로 다운그레이드',
    )(async () => {
      const existingUser = await this.usersRepository.findOne({
        where: { indexId },
      });
      if (!existingUser) {
        throw new NotFoundException(`User with indexId ${indexId} not found`);
      }

      if (existingUser.role === UserRole.ADMIN) {
        throw new ConflictException('can not downgrade this user');
      }

      if (existingUser.role === UserRole.USER) {
        throw new ConflictException('this user not editor');
      }

      existingUser.role = UserRole.USER;

      const updatedUser = await this.usersRepository.save(existingUser);

      const safeUser: SafeUser = {
        indexId: updatedUser.indexId,
        userName: updatedUser.userName,
        userEmail: updatedUser.userEmail,
        role: updatedUser.role,
        createDateTime: updatedUser.createDateTime,
        deletedDateTime: updatedUser.deletedDateTime,
        posts: updatedUser.posts,
      };
      return safeUser;
    });
  }
}
