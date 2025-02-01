import { Test, TestingModule } from '@nestjs/testing';
import { JwtSecretService } from './jwt-secret.service';

describe('JwtSecretServiceService', () => {
  let service: JwtSecretService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtSecretService],
    }).compile();

    service = module.get<JwtSecretService>(JwtSecretService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
