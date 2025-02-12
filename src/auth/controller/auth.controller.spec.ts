import { Test, TestingModule } from '@nestjs/testing';
import { User, UserRole } from '../entity/user.entity';
import { AuthService } from '../service/auth.service';
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

const mockJwtAuthGuard = { canActivate: jest.fn(() => true) };
const mockLocalAuthGuard = { canActivate: jest.fn(() => true) };
const mockRolesGuard = { canActivate: jest.fn(() => true) };

interface RequestWithUser extends Request {
  user: User;
}

const baseMockUser: User = {
  indexId: 1,
  userName: 'testuser',
  userEmail: 'test@example.com',
  userPassword: 'hashedpassword',
  role: UserRole.USER,
  createDateTime: new Date(),
  deletedDateTime: null,
  posts: [],
  jobPostings: [],
  teaRatings: [],
  softDelete: () => {
    /* empty */
  },
  isDeleted: () => false,
  isActive: () => true,
};

function createMockUser(overrides: Partial<User> = {}): User {
  const user = new User(
    overrides.userName || 'testuser',
    overrides.userPassword || 'hashedpassword',
    overrides.userEmail || 'test@example.com',
    overrides.role || UserRole.USER,
  );

  Object.assign(user, {
    indexId: overrides.indexId || 1,
    createDateTime: overrides.createDateTime || new Date(),
    deletedDateTime: overrides.deletedDateTime || null,
    posts: overrides.posts || [],
    jobPostings: overrides.jobPostings || [],
    teaRatings: overrides.teaRatings || [],
  });

  if (overrides.softDelete) {
    user.softDelete = overrides.softDelete;
  }
  if (overrides.isDeleted) {
    user.isDeleted = overrides.isDeleted;
  }
  if (overrides.isActive) {
    user.isActive = overrides.isActive;
  }

  return user;
}

const createMockRequest = (user?: User): RequestWithUser =>
  ({ user: user || baseMockUser }) as RequestWithUser;

describe('AuthController 통합 테스트', () => {
  let controller: AuthController;
  let authService: Partial<Record<keyof AuthService, jest.Mock>>;

  beforeEach(async () => {
    authService = {
      signUp: jest.fn(),
      login: jest.fn(),
      deleteUser: jest.fn(),
      upgradeUserRole: jest.fn(),
      downgradeUserRole: jest.fn(),
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
    const validDto: CreateUserDto = new CreateUserDto(
      'testuser',
      'ValidPass123!',
      'new@example.com',
      UserRole.USER,
    );

    it('[성공] 가입 완료', async () => {
      authService.signUp!.mockResolvedValue(baseMockUser);
      const result = await controller.signUp(validDto);
      expect(result).toEqual(baseMockUser);
    });

    it('[실패] 중복 이메일', async () => {
      authService.signUp!.mockRejectedValue(
        new ConflictException('이미 사용중인 이메일입니다.'),
      );
      await expect(controller.signUp(validDto)).rejects.toThrow(
        new ConflictException('이미 사용중인 이메일입니다.'),
      );
    });
  });

  describe('로그인', () => {
    const loginDto: LoginUserDto = {
      userEmail: 'test@example.com',
      userPassword: 'hashedpassword',
    };

    it('[성공] 로그인 완료', async () => {
      authService.login!.mockResolvedValue({ access_token: 'jwt.token' });
      const req = createMockRequest(baseMockUser);
      const result = await controller.login(loginDto, req);
      expect(result).toEqual({ access_token: 'jwt.token' });
    });

    it('[실패] 로그인 실패', async () => {
      authService.login!.mockRejectedValue(
        new UnauthorizedException('유효하지 않은 인증 정보입니다.'),
      );
      const req = createMockRequest(baseMockUser);
      await expect(controller.login(loginDto, req)).rejects.toThrow(
        new UnauthorizedException('유효하지 않은 인증 정보입니다.'),
      );
    });
  });

  describe('사용자 조회', () => {
    it('[성공] 사용자 조회 데이터 반환', () => {
      const req = createMockRequest(baseMockUser);
      const result = controller.getProfile(req);
      expect(result).toEqual(baseMockUser);
      expect(result.userEmail).toBe('test@example.com');
    });
  });

  describe('계정 삭제 (accountDeletion)', () => {
    it('[성공] 본인 계정 삭제', async () => {
      authService.deleteUser!.mockResolvedValue(undefined);
      const req = createMockRequest(baseMockUser);
      await controller.accountDeletion(req);
      expect(authService.deleteUser).toHaveBeenCalledWith(baseMockUser);
    });

    it('[실패] 존재하지 않는 계정 삭제', async () => {
      authService.deleteUser!.mockRejectedValue(
        new NotFoundException('User not found'),
      );
      const req = createMockRequest(createMockUser({ indexId: 999 }));
      await expect(controller.accountDeletion(req)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });

    it('[실패] 다른 사용자의 계정 삭제 시도', async () => {
      const targetUser = createMockUser({ indexId: 2 });
      authService.deleteUser!.mockImplementation(async (user: User) => {
        await Promise.resolve();
        if (user.indexId !== baseMockUser.indexId) {
          throw new UnauthorizedException(
            'You can only delete your own account',
          );
        }
        return;
      });

      const req = createMockRequest(targetUser);
      await expect(controller.accountDeletion(req)).rejects.toThrow(
        'You can only delete your own account',
      );
    });
  });

  describe('사용자 등급 올리기', () => {
    it('[성공] user -> editor로 승급', async () => {
      const upgradeUser = createMockUser({ role: UserRole.EDITOR });
      authService.upgradeUserRole!.mockResolvedValue(upgradeUser);
      const result = await controller.upgradeUserRole('1');
      expect(result).toEqual(upgradeUser);
    });

    it('[실패] editor -> editor로 승급', async () => {
      authService.upgradeUserRole!.mockRejectedValue(
        new ConflictException('User role is already updated'),
      );
      await expect(controller.upgradeUserRole('1')).rejects.toThrow(
        new ConflictException('User role is already updated'),
      );
    });
  });

  describe('사용자 등급 내리기', () => {
    it('[성공] editor -> user로 하락', async () => {
      const downgradedUser = createMockUser({ role: UserRole.USER });
      authService.downgradeUserRole!.mockResolvedValue(downgradedUser);
      const result = await controller.downgradeUserRole('1');
      expect(result).toEqual(downgradedUser);
    });

    it('[실패] user -> user로 하락', async () => {
      authService.downgradeUserRole!.mockRejectedValue(
        new ConflictException('can not downgrade this user'),
      );
      await expect(controller.downgradeUserRole('1')).rejects.toThrow(
        new ConflictException('can not downgrade this user'),
      );
    });
  });
});
