import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtSecretService } from './jwt-secret.service';

// npm run test -- -t 'JwtSecretService'

describe('JwtSecretService', () => {
  let service: JwtSecretService;
  let configService: ConfigService;
  let configServiceGetSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtSecretService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<JwtSecretService>(JwtSecretService);
    configService = module.get<ConfigService>(ConfigService);
    configServiceGetSpy = jest.spyOn(configService, 'get');
  });

  it('[성공] 서비스가 정의되어 있어야 함', () => {
    expect(service).toBeDefined();
  });

  describe('getHashedSecret', () => {
    it('[성공] JWT_SECRET이 정의되어 있을 때 시크릿을 반환해야 함', () => {
      const mockSecret = 'test-secret';
      configServiceGetSpy.mockReturnValue(mockSecret);

      const result = service.getHashedSecret();

      expect(result).toBe(mockSecret);
      expect(configServiceGetSpy).toHaveBeenCalledWith('JWT_SECRET');
    });

    it('[실패] JWT_SECRET이 정의되지 않았을 때 에러를 던져야 함', () => {
      configServiceGetSpy.mockReturnValue(undefined);

      expect(() => service.getHashedSecret()).toThrow(
        'JWT_SECRET is not defined in the environment variables',
      );
      expect(configServiceGetSpy).toHaveBeenCalledWith('JWT_SECRET');
    });
  });
});
