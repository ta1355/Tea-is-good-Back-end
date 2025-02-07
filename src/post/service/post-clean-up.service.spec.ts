import { Test, TestingModule } from '@nestjs/testing';
import { PostCleanUpService } from './post-clean-up.service';
import { Post } from '../entity/post.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('PostCleanUpService', () => {
  let service: PostCleanUpService;

  // 체인 방식으로 호출되는 QueryBuilder의 메서드들을 모킹합니다.
  const executeMock = jest.fn();
  const createQueryBuilderMock = {
    delete: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: executeMock,
  };

  // Repository의 createQueryBuilder()를 모킹한 객체
  const repositoryMock = {
    createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilderMock),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostCleanUpService,
        {
          provide: getRepositoryToken(Post),
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = module.get<PostCleanUpService>(PostCleanUpService);

    // 테스트를 위해 시간 고정을 진행 (예: 2022-04-01)
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2022-04-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should delete posts older than 3 months', async () => {
    // arrange : repository.delete()가 실행되었을 때 affected 개수 예시 (3개) 를 반환하도록 설정.
    executeMock.mockResolvedValue({ affected: 3 });

    // act : 스케줄러가 실행하는 함수 호출 (실제 Cron이 아닌 직접 호출)
    await service.handleExpiredPosts();

    // 2022-04-01 기준 3개월 전은 2022-01-01T00:00:00.000Z 여야 함.
    const expectedThreshold = new Date('2022-01-01T00:00:00.000Z');

    // assert : 각 체인 메서드가 올바른 인자로 호출되었는지 확인
    expect(repositoryMock.createQueryBuilder).toHaveBeenCalled();
    expect(createQueryBuilderMock.delete).toHaveBeenCalled();
    expect(createQueryBuilderMock.from).toHaveBeenCalledWith(Post);
    expect(createQueryBuilderMock.where).toHaveBeenCalledWith(
      'deletedDateTime IS NOT NULL',
    );
    expect(createQueryBuilderMock.andWhere).toHaveBeenCalledWith(
      'deletedDateTime < :threshold',
      { threshold: expectedThreshold },
    );
    expect(createQueryBuilderMock.execute).toHaveBeenCalled();
  });
});
