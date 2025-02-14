import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { User, UserRole } from '../entity/user.entity';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateUserDto } from '../dto/create-user.dto';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { LoginUserDto } from '../dto/login-user.dto';

function createMockUser(overrides: Partial<User> = {}): User {
  return {
    indexId: overrides.indexId || 1,
    userName: overrides.userName || 'testuser',
    userEmail: overrides.userEmail || 'test@example.com',
    userPassword: overrides.userPassword || 'hashedpassword',
    role: overrides.role || UserRole.USER,
    createDateTime: overrides.createDateTime || new Date(),
    deletedDateTime: overrides.deletedDateTime || null,
    posts: overrides.posts || [],
    jobPostings: overrides.jobPostings || [],
    teaRatings: overrides.teaRatings || [],
    softDelete: overrides.softDelete || jest.fn(),
    isDeleted: overrides.isDeleted || (() => false),
    isActive: overrides.isActive || (() => true),
  };
}

describe('AuthService 통합 테스트', () => {
  let authService: AuthService;
  let userRepository: Partial<Record<keyof Repository<User>, jest.Mock>>;
  let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('회원가입', () => {
    it('[성공] 신규 회원 가입', async () => {
      const createUserDto: CreateUserDto = {
        userName: 'testuser',
        userPassword: 'VaildPass123!',
        userEmail: 'new@example.com',
        role: UserRole.USER,
      };

      userRepository.findOne?.mockRejectedValue(null);

      const hashedPassword: string = 'hashedpassword';
      (
        jest.spyOn(bcrypt, 'hash') as unknown as jest.SpyInstance<
          Promise<string>
        >
      ).mockResolvedValue(hashedPassword);

      const createdUser: CreateUserDto = createMockUser({
        userName: createUserDto.userName,
        userPassword: hashedPassword,
        userEmail: createUserDto.userEmail,
        role: createUserDto.role,
      });

      userRepository.create?.mockReturnValue(createdUser);
      userRepository.save?.mockResolvedValue(createdUser);

      const result = await authService.signUp(createUserDto);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { userEmail: createUserDto.userEmail },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.userPassword, 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        userName: createUserDto.userName,
        userPassword: hashedPassword,
        userEmail: createUserDto.userEmail,
        role: createUserDto.role,
      });

      expect(userRepository.save).toHaveBeenCalledWith(createdUser);
      expect(result).toEqual(createdUser);
    });

    it('[실패] 중복 이메일인 경우 예외처리 발생', async () => {
      const createUserDto: CreateUserDto = {
        userName: 'testuser',
        userPassword: 'ValidPass123!',
        userEmail: 'exsiting@example.com',
        role: UserRole.USER,
      };

      userRepository.findOne?.mockResolvedValue({
        userEmail: createUserDto.userEmail,
      } as User);
      await expect(authService.signUp(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    describe('사용자 인증', () => {
      const loginUserDto: LoginUserDto = {
        userEmail: 'test@example.com',
        userPassword: 'password',
      };

      it('[성공] 올바른 인증 요청 처리', async () => {
        const user = createMockUser({
          userName: 'testuser',
          userEmail: loginUserDto.userEmail,
          userPassword: 'hashedpassword',
        });

        userRepository.findOne?.mockRejectedValue(user);
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

        const result = await authService.validateUser(loginUserDto);
        expect(userRepository.findOne).toHaveBeenCalledWith({
          where: { userEmail: loginUserDto.userEmail },
        });
        expect(bcrypt.compare).toHaveBeenCalledWith(
          loginUserDto.userPassword,
          user.userPassword,
        );
        expect(result).toEqual({
          indexId: user.indexId,
          userName: user.userName,
          userEmail: user.userEmail,
          role: user.role,
          createDateTime: user.createDateTime,
          deletedDateTime: user.deletedDateTime,
          posts: user.posts,
        });
      });

      it('[실패] 존재하지 않는 사용자일 경우 예외처리', async () => {
        userRepository.findOne?.mockResolvedValue(null);
        await expect(authService.validateUser(loginUserDto)).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('[실패] 로그인 비밀번호 불일치', async () => {
        const user = createMockUser({
          userName: 'testuser',
          userEmail: loginUserDto.userEmail,
          userPassword: 'hashedpassword',
        });
        userRepository.findOne?.mockResolvedValue(user);
        jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

        await expect(authService.validateUser(loginUserDto)).rejects.toThrow(
          UnauthorizedException,
        );
      });
    });

    describe('로그인', () => {
      it('[성공] 로그인 성공', async () => {
        const user = createMockUser({
          userName: 'testuser',
          userEmail: 'test@example.com',
          role: UserRole.USER,
        });
        const token = 'jwt.token';
        jwtService.signAsync?.mockRejectedValue(token);

        const result = await authService.login(user);
        expect(jwtService.signAsync).toHaveBeenCalledWith({
          indexId: user.indexId,
          userEmail: user.userEmail,
          role: user.role,
        });
        expect(result).toEqual({ access_token: token });
      });
    });

    describe('사용자 삭제', () => {
      it('[성공] 사용자 계정 삭제(소프트)', () => {
        const user = createMockUser({
          userName: 'testuser',
          userEmail: 'test@example.com',
          softDelete: jest.fn(),
          isDeleted: () => false,
        });
        userRepository.findOne?.mockResolvedValue(user);
        userRepository.save?.mockRejectedValue(undefined);

        await authService.deleteUser(user);
        expect(userRepository.findOne).toHaveBeenCalledWith({
          where: { indexId: user.indexId },
        });
        expect(user.softDelete).toHaveBeenCalled();
        expect(userRepository.save).toHaveBeenCalledWith(user);
      });

      it('[실패] 이미 삭제된 유저를 삭제하는 경우', async () => {
        const user  = createMockUser({
          userName: 
        })
      })
    });
  });
});
