import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../service/auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../entity/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from '../dto/create-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';

// npm run test -- -t 'AuthService 통합 테스트'

describe('AuthService 통합 테스트', () => {
  let authService: AuthService;
  let userRepository: Partial<Record<keyof Repository<User>, jest.Mock>>;
  let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;
  let validCreateUserDto: CreateUserDto;
  let validLoginUserDto: LoginUserDto;
  let mockUser: User;

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
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);

    validCreateUserDto = {
      userName: 'testuser',
      userPassword: 'ValidPass123!',
      userEmail: 'new@example.com',
      role: UserRole.USER,
    };

    validLoginUserDto = {
      userEmail: 'test@example.com',
      userPassword: 'password',
    };

    mockUser = {
      indexId: 1,
      userName: 'testuser',
      userEmail: 'test@example.com',
      userPassword: 'hashedpassword',
      role: UserRole.USER,
      createDateTime: new Date(),
      deletedDateTime: null,
      posts: [],
      softDelete: jest.fn(),
      isDeleted: () => false,
      isActive: () => true,
    };
  });

  describe('회원가입 (signUp)', () => {
    it('[성공] 신규 회원 가입 시 사용자 반환', async () => {
      userRepository.findOne?.mockResolvedValue(null);
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(async () => 'hashedpassword');

      userRepository.create?.mockReturnValue(mockUser);
      userRepository.save?.mockResolvedValue(mockUser);

      const result = await authService.signUp(validCreateUserDto);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { userEmail: validCreateUserDto.userEmail },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(
        validCreateUserDto.userPassword,
        10,
      );
      expect(userRepository.create).toHaveBeenCalledWith({
        userName: validCreateUserDto.userName,
        userPassword: 'hashedpassword',
        userEmail: validCreateUserDto.userEmail,
        role: validCreateUserDto.role,
      });
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });

    it('[실패] 중복 이메일인 경우 ConflictException 발생', async () => {
      userRepository.findOne?.mockResolvedValue(mockUser);
      await expect(authService.signUp(validCreateUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('사용자 인증 (validateUser)', () => {
    it('[성공] 올바른 자격 증명으로 사용자 반환', async () => {
      userRepository.findOne?.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await authService.validateUser(validLoginUserDto);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { userEmail: validLoginUserDto.userEmail },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        validLoginUserDto.userPassword,
        mockUser.userPassword,
      );
      expect(result).toEqual({
        indexId: mockUser.indexId,
        userName: mockUser.userName,
        userEmail: mockUser.userEmail,
        role: mockUser.role,
        createDateTime: mockUser.createDateTime,
        deletedDateTime: mockUser.deletedDateTime,
        posts: mockUser.posts,
      });
    });

    it('[실패] 존재하지 않는 사용자일 경우 UnauthorizedException 발생', async () => {
      userRepository.findOne?.mockResolvedValue(null);
      await expect(authService.validateUser(validLoginUserDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('[실패] 비밀번호 불일치로 인해 UnauthorizedException 발생', async () => {
      userRepository.findOne?.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      await expect(authService.validateUser(validLoginUserDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('로그인 (login)', () => {
    it('[성공] JWT 토큰 발급', async () => {
      const token = 'jwt.token';
      jwtService.signAsync?.mockResolvedValue(token);

      const result = await authService.login(mockUser);
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        indexId: mockUser.indexId,
        userEmail: mockUser.userEmail,
        role: mockUser.role,
      });
      expect(result).toEqual({ access_token: token });
    });
  });

  describe('계정 삭제 (deleteUser)', () => {
    it('[성공] 사용자 계정 소프트 삭제 성공', async () => {
      const mockSoftDelete = jest.fn().mockImplementation(function (
        this: User,
      ) {
        this.deletedDateTime = new Date();
      });
      const mockUserWithSoftDelete: User = {
        ...mockUser,
        softDelete: mockSoftDelete,
        isDeleted: jest.fn().mockReturnValue(false),
        isActive: jest.fn().mockReturnValue(true),
        deletedDateTime: null,
      };

      userRepository.findOne?.mockResolvedValue(mockUserWithSoftDelete);
      userRepository.save?.mockImplementation((user: User) =>
        Promise.resolve(user),
      );

      await authService.deleteUser(mockUser);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { indexId: mockUser.indexId },
      });
      expect(mockSoftDelete).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining<Partial<User>>({
          ...mockUserWithSoftDelete,
          deletedDateTime: expect.any(Date) as Date,
        }),
      );
    });

    it('[실패] 존재하지 않는 사용자 삭제 시 NotFoundException 발생', async () => {
      userRepository.findOne?.mockResolvedValue(null);
      await expect(authService.deleteUser(mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('[실패] 이미 삭제된 사용자일 경우 ConflictException 발생', async () => {
      const deletedUser = {
        ...mockUser,
        isDeleted: () => true,
        softDelete: jest.fn(),
        isActive: () => true,
      };
      userRepository.findOne?.mockResolvedValue(deletedUser);
      await expect(authService.deleteUser(deletedUser)).rejects.toThrow(
        ConflictException,
      );
    });

    it('[실패] 타인 계정 삭제 시 UnauthorizedException 발생', async () => {
      const otherUser = { ...mockUser, indexId: 2 };
      userRepository.findOne?.mockResolvedValue(otherUser);
      await expect(authService.deleteUser(mockUser)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('사용자 등급 조정', () => {
    describe('등급 상승 (upgradeUserRole)', () => {
      it('[성공] 일반 사용자(USER) -> 에디터(EDITOR)로 변경 성공', async () => {
        const upgradedUser = { ...mockUser, role: UserRole.EDITOR };
        userRepository.findOne?.mockResolvedValue(mockUser);
        userRepository.save?.mockResolvedValue(upgradedUser);

        const result = await authService.upgradeUserRole(1);
        expect(userRepository.findOne).toHaveBeenCalledWith({
          where: { indexId: 1 },
        });
        expect(userRepository.save).toHaveBeenCalled();
        expect(result.role).toBe(UserRole.EDITOR);
      });

      it('[실패] 존재하지 않는 사용자일 경우 NotFoundException 발생', async () => {
        userRepository.findOne?.mockResolvedValue(null);
        await expect(authService.upgradeUserRole(1)).rejects.toThrow(
          NotFoundException,
        );
      });

      it('[실패] 이미 에디터(EDITOR)인 경우 ConflictException 발생', async () => {
        const editorUser = { ...mockUser, role: UserRole.EDITOR };
        userRepository.findOne?.mockResolvedValue(editorUser);
        await expect(authService.upgradeUserRole(1)).rejects.toThrow(
          ConflictException,
        );
      });

      it('[실패] 관리자인 경우 권한 업데이트 불가로 ConflictException 발생', async () => {
        const adminUser = { ...mockUser, role: UserRole.ADMIN };
        userRepository.findOne?.mockResolvedValue(adminUser);
        await expect(authService.upgradeUserRole(1)).rejects.toThrow(
          ConflictException,
        );
      });
    });

    describe('등급 하락 (downgradeUserRole)', () => {
      it('[성공] 에디터(EDITOR) -> 일반 사용자(USER)로 변경 성공', async () => {
        const editorUser = { ...mockUser, role: UserRole.EDITOR };
        const downgradedUser = { ...editorUser, role: UserRole.USER };
        userRepository.findOne?.mockResolvedValue(editorUser);
        userRepository.save?.mockResolvedValue(downgradedUser);

        const result = await authService.downgradeUserRole(1);
        expect(userRepository.findOne).toHaveBeenCalledWith({
          where: { indexId: 1 },
        });
        expect(userRepository.save).toHaveBeenCalled();
        expect(result.role).toBe(UserRole.USER);
      });

      it('[실패] 존재하지 않는 사용자일 경우 NotFoundException 발생', async () => {
        userRepository.findOne?.mockResolvedValue(null);
        await expect(authService.downgradeUserRole(1)).rejects.toThrow(
          NotFoundException,
        );
      });

      it('[실패] 관리자인 경우 다운그레이드 불가로 ConflictException 발생', async () => {
        const adminUser = { ...mockUser, role: UserRole.ADMIN };
        userRepository.findOne?.mockResolvedValue(adminUser);
        await expect(authService.downgradeUserRole(1)).rejects.toThrow(
          ConflictException,
        );
      });

      it('[실패] 이미 일반 사용자(USER)인 경우 ConflictException 발생', async () => {
        userRepository.findOne?.mockResolvedValue(mockUser);
        await expect(authService.downgradeUserRole(1)).rejects.toThrow(
          ConflictException,
        );
      });
    });
  });
});
