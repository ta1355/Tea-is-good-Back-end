import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Post } from '../entity/post.entity';
import { User, UserRole } from 'src/auth/entity/user.entity';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

describe('PostService', () => {
  let service: PostService;
  let mockPostRepository: jest.Mocked<Repository<Post>>;

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

  type MockQueryBuilder = {
    leftJoinAndSelect: jest.Mock;
    select: jest.Mock;
    where: jest.Mock;
    skip: jest.Mock;
    take: jest.Mock;
    getMany: jest.Mock;
    getOne: jest.Mock;
  };

  beforeEach(async () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getOne: jest.fn(),
    } as MockQueryBuilder;

    mockPostRepository = {
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as unknown as jest.Mocked<Repository<Post>>;

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
    it('[성공] 새 포스트를 생성해야 함', async () => {
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

      mockPostRepository.create.mockReturnValue(createdPost);
      mockPostRepository.save.mockResolvedValue(createdPost);

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
      mockPostRepository.save.mockRejectedValue(new Error('DB 에러'));

      await expect(service.createPost(createPostDto, mockUser)).rejects.toThrow(
        'DB 에러',
      );
    });
  });

  describe('getAllPosts', () => {
    it('[성공] 모든 포스트를 페이지네이션과 함께 반환해야 함', async () => {
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
      (
        mockPostRepository.createQueryBuilder() as unknown as MockQueryBuilder
      ).getMany.mockResolvedValue(mockPosts);

      const result = await service.getAllPosts(1, 10);

      expect(result).toEqual(mockPosts);
      expect(
        (mockPostRepository.createQueryBuilder() as unknown as MockQueryBuilder)
          .skip,
      ).toHaveBeenCalledWith(0);
      expect(
        (mockPostRepository.createQueryBuilder() as unknown as MockQueryBuilder)
          .take,
      ).toHaveBeenCalledWith(10);
    });
  });

  describe('getPostById', () => {
    it('[성공] ID로 포스트를 조회해야 함', async () => {
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
      (
        mockPostRepository.createQueryBuilder() as unknown as MockQueryBuilder
      ).getOne.mockResolvedValue(mockPost);

      const result = await service.getPostById(1);

      expect(result).toEqual(mockPost);
    });

    it('[실패] 존재하지 않는 ID로 조회 시 NotFoundException을 던져야 함', async () => {
      (
        mockPostRepository.createQueryBuilder() as unknown as MockQueryBuilder
      ).getOne.mockResolvedValue(null);

      await expect(service.getPostById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePost', () => {
    it('[성공] 포스트를 업데이트해야 함', async () => {
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
      const updatedPost: Post = { ...existingPost, title: updatePostDto.title };

      (
        mockPostRepository.createQueryBuilder() as unknown as MockQueryBuilder
      ).getOne.mockResolvedValue(existingPost);
      mockPostRepository.save.mockResolvedValue(updatedPost);

      const result = await service.updatePost(1, updatePostDto, mockUser);

      expect(result).toEqual(updatedPost);
    });

    it('[실패] 다른 사용자의 포스트 수정 시 ForbiddenException을 던져야 함', async () => {
      const otherUser: User = {
        ...mockUser,
        indexId: 2,
        userName: 'otherUser',
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

      (
        mockPostRepository.createQueryBuilder() as unknown as MockQueryBuilder
      ).getOne.mockResolvedValue(existingPost);

      await expect(
        service.updatePost(1, { title: '수정된 제목' }, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deletePost', () => {
    it('[성공] 포스트를 소프트 삭제해야 함', async () => {
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
      (
        mockPostRepository.createQueryBuilder() as unknown as MockQueryBuilder
      ).getOne.mockResolvedValue(existingPost);

      await service.deletePost(1, mockUser);

      expect(mockPostRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedDateTime: expect.any(Date),
        }),
      );
    });

    it('[실패] 다른 사용자의 포스트 삭제 시 ForbiddenException을 던져야 함', async () => {
      const otherUser: User = {
        ...mockUser,
        indexId: 2,
        userName: 'otherUser',
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

      (
        mockPostRepository.createQueryBuilder() as unknown as MockQueryBuilder
      ).getOne.mockResolvedValue(existingPost);

      await expect(service.deletePost(1, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
