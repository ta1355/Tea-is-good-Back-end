import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '../entity/user.entity';
import { AuthService, SafeUser } from '../service/auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { CreateUserDto } from '../dto/create-user.dto';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginUserDto } from '../dto/login-user.dto';
import { Request } from 'express';

const ERROR_MESSAGES = {
  DUPLICATE_EMAIL: '이미 사용중인 이메일입니다.',
  INVALID_CREDENTIALS: '유효하지 않은 인증 정보입니다.',
  USER_NOT_FOUND: 'User not found',
  UNAUTHORIZED_DELETE: 'You can only delete your own account',
  ROLE_UPDATE_CONFLICT: 'User role is already up to date',
  CANNOT_UPDATE_ADMIN: 'Cannot update admin role',
};

const mockJwtAuthGuard = { canActivate: jest.fn(() => true) };
const mockLocalAuthGuard = { canActivate: jest.fn(() => true) };
const mockRolesGuard = { canActivate: jest.fn(() => true) };

interface RequestWithUser extends Request {
  user: SafeUser;
}

function createMockUser(overrides: Partial<SafeUser> = {}): SafeUser {
  return {
    indexId: overrides.indexId || 1,
    userName: overrides.userName || 'testuser',
    userEmail: overrides.userEmail || 'test@example.com',
    role: overrides.role || UserRole.USER,
    createDateTime: overrides.createDateTime || new Date(),
    deletedDateTime: overrides.deletedDateTime || null,
    posts: overrides.posts || [],
  };
}

const createMockRequest = (user?: SafeUser): RequestWithUser =>
  ({ user: user || createMockUser() }) as RequestWithUser;

describe('AuthController 통합 테스트', () => {
  let controller: AuthController;
  let authService: Partial<Record<keyof AuthService, jest.Mock>>;
  let validDto: CreateUserDto;
  let loginDto: LoginUserDto;

  beforeEach(async () => {
    validDto = new CreateUserDto(
      'testuser',
      'ValidPass123!',
      'new@example.com',
      UserRole.USER,
    );
    loginDto = {
      userEmail: 'test@example.com',
      userPassword: 'hashedpassword',
    };

    authService = {
      signUp: jest.fn(),
      login: jest.fn(),
      deleteUser: jest.fn(),
      updateUserRole: jest.fn(),
      getAllUsers: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(LocalAuthGuard)
      .useValue(mockLocalAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('회원가입', () => {
    it('[성공] 정상 가입 시 사용자 반환', async () => {
      const mockUser = createMockUser();
      authService.signUp?.mockResolvedValue(mockUser);

      const result = await controller.signUp(validDto);
      expect(result).toEqual(mockUser);
      expect(authService.signUp).toHaveBeenCalledWith(validDto);
    });

    it('[실패] 중복 이메일 가입 시 예외 발생', async () => {
      authService.signUp?.mockRejectedValue(
        new ConflictException(ERROR_MESSAGES.DUPLICATE_EMAIL),
      );
      await expect(controller.signUp(validDto)).rejects.toThrow(
        ERROR_MESSAGES.DUPLICATE_EMAIL,
      );
    });
  });

  describe('로그인', () => {
    it('[성공] 유효한 자격 증명으로 JWT 토큰 반환', async () => {
      authService.login?.mockResolvedValue({ access_token: 'jwt.token' });
      const req = createMockRequest();

      const result = await controller.login(loginDto, req);
      expect(result).toEqual({ access_token: 'jwt.token' });
    });

    it('[실패] 잘못된 비밀번호로 로그인 시도', async () => {
      authService.login?.mockRejectedValue(
        new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS),
      );
      const req = createMockRequest();

      await expect(controller.login(loginDto, req)).rejects.toThrow(
        ERROR_MESSAGES.INVALID_CREDENTIALS,
      );
    });
  });

  describe('사용자 조회', () => {
    it('[성공] 인증된 사용자 정보 반환', () => {
      const mockUser = createMockUser();
      const req = createMockRequest(mockUser);

      const result = controller.getProfile(req);
      expect(result).toEqual(mockUser);
      expect(result.userEmail).toBe(mockUser.userEmail);
    });
  });

  describe('계정 삭제', () => {
    it('[성공] 본인 계정 삭제 처리', async () => {
      const mockUser = createMockUser();
      authService.deleteUser?.mockResolvedValue(undefined);
      const req = createMockRequest(mockUser);

      await controller.accountDeletion(req);
      expect(authService.deleteUser).toHaveBeenCalledWith(mockUser);
    });

    it('[실패] 존재하지 않는 사용자 삭제 시도', async () => {
      const nonExistingUser = createMockUser({ indexId: 999 });
      authService.deleteUser?.mockRejectedValue(
        new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND),
      );
      const req = createMockRequest(nonExistingUser);

      await expect(controller.accountDeletion(req)).rejects.toThrow(
        ERROR_MESSAGES.USER_NOT_FOUND,
      );
    });
  });

  describe('사용자 등급 조정', () => {
    it('[성공] USER -> EDITOR 승급', async () => {
      const upgradedUser = createMockUser({ role: UserRole.EDITOR });
      authService.updateUserRole?.mockResolvedValue(upgradedUser);

      const result = await controller.upgradeUserRole('1');
      expect(result).toEqual(upgradedUser);
      expect(authService.updateUserRole).toHaveBeenCalledWith(
        1,
        UserRole.EDITOR,
      );
    });

    it('[성공] EDITOR -> USER 강등', async () => {
      const downgradedUser = createMockUser({ role: UserRole.USER });
      authService.updateUserRole?.mockResolvedValue(downgradedUser);

      const result = await controller.downgradeUserRole('1');
      expect(result).toEqual(downgradedUser);
      expect(authService.updateUserRole).toHaveBeenCalledWith(1, UserRole.USER);
    });

    it('[실패] 이미 동일한 역할인 경우', async () => {
      authService.updateUserRole?.mockRejectedValue(
        new ConflictException(ERROR_MESSAGES.ROLE_UPDATE_CONFLICT),
      );

      await expect(controller.upgradeUserRole('1')).rejects.toThrow(
        ERROR_MESSAGES.ROLE_UPDATE_CONFLICT,
      );
    });
  });

  describe('모든 사용자 조회', () => {
    it('[성공] 모든 사용자 목록 반환', async () => {
      const mockUsers = [createMockUser(), createMockUser({ indexId: 2 })];
      authService.getAllUsers?.mockResolvedValue(mockUsers);

      const result = await controller.findAllUser();
      expect(result).toEqual(mockUsers);
      expect(authService.getAllUsers).toHaveBeenCalled();
    });
  });
});
