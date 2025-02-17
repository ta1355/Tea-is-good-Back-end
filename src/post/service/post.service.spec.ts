import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Post } from '../entity/post.entity';
import { User, UserRole } from 'src/auth/entity/user.entity';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ObjectLiteral } from 'typeorm';

// npm run test -- -t 'PostService'

type MockRepository<T extends ObjectLiteral> = {
  [K in keyof Repository<T>]: jest.Mock;
};

type MockQueryBuilder<T extends ObjectLiteral> = {
  [K in keyof SelectQueryBuilder<T>]: jest.Mock;
};

describe('PostService', () => {
  let service: PostService;
  let mockPostRepository: MockRepository<Post>;
  let mockQueryBuilder: MockQueryBuilder<Post>;

  const mockUser: User = {
    indexId: 1,
    userName: 'testUser',
    userPassword: 'securePassword123',
    userEmail: 'test@example.com',
    role: UserRole.USER,
    createDateTime: new Date('2025-02-16T13:50:31.144Z'),
    deletedDateTime: null,
    posts: [],
    jobPostings: [],
    teaRatings: [],
    softDelete: function () {
      this.deletedDateTime = new Date();
    },
    isDeleted: function (): boolean {
      return this.deletedDateTime !== null;
    },
    isActive: function (): boolean {
      return this.deletedDateTime === null;
    },
  } as User;

  beforeEach(async () => {
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getOne: jest.fn().mockResolvedValue(null),
    } as unknown as MockQueryBuilder<Post>;

    mockPostRepository = {
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as unknown as MockRepository<Post>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        {
          provide: getRepositoryToken(Post),
          useValue: mockPostRepository,
        },
      ],
    }).compile();

    service = module.get<PostService>(PostService);
  });

  it('[성공] should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPost', () => {
    it('[성공] 새 게시글을 생성해야 함', async () => {
      const createPostDto: CreatePostDto = {
        title: '테스트 제목',
        detail: '테스트 내용',
      };
      const createdPost: Post = new Post(
        createPostDto.title,
        createPostDto.detail,
        'draft',
        0,
        0,
        false,
        undefined,
        undefined,
        undefined,
        mockUser,
      );
      createdPost.indexId = 1;

      mockPostRepository.create?.mockReturnValue(createdPost);
      mockPostRepository.save?.mockResolvedValue(createdPost);

      const result = await service.createPost(createPostDto, mockUser);

      expect(result).toEqual(createdPost);
      expect(mockPostRepository.create).toHaveBeenCalledWith({
        ...createPostDto,
        user: mockUser,
      });
      expect(mockPostRepository.save).toHaveBeenCalledWith(createdPost);
    });

    it('[실패] 저장 중 에러 발생 시 예외를 던져야 함', async () => {
      const createPostDto: CreatePostDto = {
        title: '테스트 제목',
        detail: '테스트 내용',
      };
      jest
        .spyOn(mockPostRepository, 'save')
        .mockRejectedValue(new Error('게시글 생성 처리 중 오류 발생'));

      await expect(service.createPost(createPostDto, mockUser)).rejects.toThrow(
        '게시글 생성 처리 중 오류 발생',
      );
    });
  });

  describe('getAllPosts', () => {
    it('[성공] 모든 게시글은 페이지네이션과 함께 반환해야 함', async () => {
      const mockPosts: Post[] = [
        new Post(
          '테스트 포스트',
          '테스트 내용',
          'published',
          0,
          0,
          false,
          undefined,
          undefined,
          undefined,
          mockUser,
        ),
      ];
      mockPosts[0].indexId = 1;
      mockQueryBuilder.getMany.mockResolvedValue(mockPosts);

      const result = await service.getAllPosts(1, 10);

      expect(result).toEqual(mockPosts);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });
  });

  describe('getPostById', () => {
    it('[성공] ID로 게시글 조회', async () => {
      const mockPost: Post = new Post(
        '테스트 포스트',
        '테스트 내용',
        'published',
        0,
        0,
        false,
        undefined,
        undefined,
        undefined,
        mockUser,
      );
      mockPost.indexId = 1;
      jest
        .spyOn(mockPostRepository.createQueryBuilder(), 'getOne')
        .mockResolvedValue(mockPost);

      const result = await service.getPostById(1);

      expect(result).toEqual(mockPost);
    });

    it('[실패] 존재하지 않는 ID로 조회 시 NotFoundException 발생', async () => {
      jest
        .spyOn(mockPostRepository.createQueryBuilder(), 'getOne')
        .mockResolvedValue(null);

      await expect(service.getPostById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePost', () => {
    it('[성공] 게시글을 업데이트', async () => {
      const updatePostDto: UpdatePostDto = { title: '수정된 제목' };
      const existingPost: Post = new Post(
        '원래 제목',
        '테스트 내용',
        'published',
        0,
        0,
        false,
        undefined,
        undefined,
        undefined,
        mockUser,
      );
      existingPost.indexId = 1;
      const updatedPost: Post = {
        ...existingPost,
        title: updatePostDto.title ?? existingPost.title,
        incrementViewCount: jest.fn(),
        incrementLikeCount: jest.fn(),
        decrementLikeCount: jest.fn(),
        isDeleted: jest.fn(),
      };

      jest
        .spyOn(mockPostRepository.createQueryBuilder(), 'getOne')
        .mockResolvedValue(existingPost);
      jest.spyOn(mockPostRepository, 'save').mockResolvedValue(updatedPost);

      const result = await service.updatePost(1, updatePostDto, mockUser);

      expect(result).toEqual(updatedPost);
    });

    it('[실패] 다른 사용자의 게시글 수정 시 ForbiddenException', async () => {
      const otherUser: User = {
        ...mockUser,
        indexId: 2,
        userName: 'otherUser',
        isDeleted: () => false,
        isActive: () => true,
      };
      const existingPost: Post = new Post(
        '원래 제목',
        '테스트 내용',
        'published',
        0,
        0,
        false,
        undefined,
        undefined,
        undefined,
        otherUser,
      );
      existingPost.indexId = 1;

      jest
        .spyOn(mockPostRepository.createQueryBuilder(), 'getOne')
        .mockResolvedValue(existingPost);

      await expect(
        service.updatePost(1, { title: '수정된 제목' }, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deletePost', () => {
    it('[성공] 게시글을 소프트 삭제', async () => {
      const existingPost: Post = new Post(
        '삭제할 포스트',
        '테스트 내용',
        'published',
        0,
        0,
        false,
        undefined,
        undefined,
        undefined,
        mockUser,
      );
      existingPost.indexId = 1;
      jest
        .spyOn(mockPostRepository.createQueryBuilder(), 'getOne')
        .mockResolvedValue(existingPost);

      await service.deletePost(1, mockUser);

      expect(mockPostRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedDateTime: expect.any(Date) as Date,
        }),
      );
    });

    it('[실패] 다른 사용자의 게시글 삭제 시 ForbiddenException', async () => {
      const otherUser: User = {
        ...mockUser,
        indexId: 2,
        userName: 'otherUser',
        isDeleted: function (): boolean {
          return this.deletedDateTime !== null;
        },
        isActive: function (): boolean {
          return this.deletedDateTime === null;
        },
      };
      const existingPost: Post = new Post(
        '삭제할 포스트',
        '테스트 내용',
        'published',
        0,
        0,
        false,
        undefined,
        undefined,
        undefined,
        otherUser,
      );
      existingPost.indexId = 1;

      jest
        .spyOn(mockPostRepository.createQueryBuilder(), 'getOne')
        .mockResolvedValue(existingPost);

      await expect(service.deletePost(1, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
