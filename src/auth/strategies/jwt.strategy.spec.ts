import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { JwtSecretService } from '../jwt/jwt-secret.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entity/user.entity';

// npm run test -- -t 'JwtStrategy'

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let configService: ConfigService<Record<string, unknown>, false>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let jwtSecretService: JwtSecretService;
  let userRepository: { findOne: jest.Mock };

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
        {
          provide: JwtSecretService,
          useValue: {
            getHashedSecret: jest.fn().mockReturnValue('hashedSecret'),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
      ],
    }).compile();

    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigService>(ConfigService);
    jwtSecretService = module.get<JwtSecretService>(JwtSecretService);
  });

  it('[성공] 유효한 페이로드로 사용자 검증', async () => {
    const mockUser = {
      indexId: 1,
      userEmail: 'test@example.com',
      role: 'user',
    };
    userRepository.findOne.mockResolvedValue(mockUser);

    const payload = { indexId: 1, userEmail: 'test@example.com', role: 'user' };
    const result = await jwtStrategy.validate(payload);

    expect(result).toEqual(mockUser);
    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { indexId: 1 },
    });
  });

  it('[실패] 잘못된 페이로드로 UnauthorizedException 발생', async () => {
    const invalidPayload = { userEmail: 'test@example.com' };
    await expect(jwtStrategy.validate(invalidPayload as any)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('[실패] 존재하지 않는 사용자로 UnauthorizedException 발생', async () => {
    userRepository.findOne.mockResolvedValue(null);

    const payload = { indexId: 1, userEmail: 'test@example.com', role: 'user' };
    await expect(jwtStrategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('[실패] 데이터베이스 오류 시 UnauthorizedException 발생', async () => {
    userRepository.findOne.mockRejectedValue(new Error('Database error'));

    const payload = { indexId: 1, userEmail: 'test@example.com', role: 'user' };
    await expect(jwtStrategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
