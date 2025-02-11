import { Test, TestingModule } from '@nestjs/testing';
import { User, UserRole } from '../entity/user.entity';
import { AuthService } from '../service/auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { CreateUserDto } from '../dto/create-user.dto';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { LoginUserDto } from '../dto/login-user.dto';
import { Request } from 'express';

const mockJwtAuthGuard = { canActivate: jest.fn(() => true) };
const mockLocalAuthGuard = { canActivate: jest.fn(() => true) };
const mockRolesGuard = { canActivate: jest.fn(() => true) };

interface RequestWithUser extends Request {
  user: User;
}

const mockUser: User = {
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

const createMockRequest = (user?: User): RequestWithUser =>
  ({ user }) as RequestWithUser;

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
      authService.signUp?.mockResolvedValue(mockUser);
      const result = await controller.signUp(validDto);
      expect(result).toEqual(mockUser);
    });

    it('[실패] 중복 이메일', async () => {
      authService.signUp?.mockRejectedValue(
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
      authService.login?.mockResolvedValue({ access_token: 'jwt.token' });
      const req = createMockRequest(mockUser);
      const result = await controller.login(loginDto, req);
      expect(result).toEqual({ access_token: 'jwt.token' });
    });

    it('[실패] 로그인 실패', async () => {
      authService.login?.mockRejectedValue(
        new UnauthorizedException('유효하지 않은 인증 정보입니다.'),
      );
      const req = createMockRequest(mockUser);
      await expect(controller.login(loginDto, req)).rejects.toThrow(
        new UnauthorizedException('유효하지 않은 인증 정보입니다.'),
      );
    });
  });

  describe('사용자 조회', () => {
    it('[성공] 사용자 조회 데이터 반환', () => {
      const req = createMockRequest(mockUser);
    });
  });
});
