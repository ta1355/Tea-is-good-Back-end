import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from '../entity/post.entity';
import { Repository } from 'typeorm';
import { CreatePostDto } from '../dto/create-post.dto';
import { User } from 'src/auth/entity/user.entity';
import { UpdatePostDto } from '../dto/update-post.dto';
import { withErrorHandling } from 'src/common/errors';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  async createPost(createPostDto: CreatePostDto, user: User): Promise<Post> {
    return withErrorHandling(
      this.logger,
      '게시글 생성',
    )(async () => {
      const post = this.postRepository.create({
        ...createPostDto,
        user,
        tags: createPostDto.tags ?? null,
        category: createPostDto.category,
      });
      return await this.postRepository.save(post);
    });
  }

  async getAllPosts(page: number = 1, limit: number = 10): Promise<Post[]> {
    return withErrorHandling(
      this.logger,
      '게시글 목록 조회',
    )(async () => {
      const posts = await this.postRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.user', 'user')
        .select(['post', 'user.userName'])
        .where('post.deletedDateTime IS NULL')
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();
      return posts;
    });
  }

  async getPostById(id: number): Promise<Post> {
    return withErrorHandling(
      this.logger,
      '게시글 상세 조회',
    )(async () => {
      const post = await this.postRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.user', 'user')
        .select(['post', 'user.userName', 'user.indexId'])
        .where('post.indexId = :id AND post.deletedDateTime IS NULL', { id })
        .getOne();

      if (!post) {
        throw new NotFoundException('게시글을 찾을 수 없습니다');
      }
      return post;
    });
  }

  async updatePost(
    id: number,
    updatePostDto: UpdatePostDto,
    user: User,
  ): Promise<Post> {
    return withErrorHandling(
      this.logger,
      '게시글 수정',
    )(async () => {
      const post = await this.getPostById(id);
      if (post.user.indexId !== user.indexId) {
        throw new ForbiddenException('본인의 게시글만 수정 가능합니다');
      }
      const updatedPost = {
        ...post,
        ...updatePostDto,
        tags: updatePostDto.tags ?? post.tags,
        category: updatePostDto.category ?? post.category,
      };
      return this.postRepository.save(updatedPost);
    });
  }

  async deletePost(id: number, user: User): Promise<void> {
    return withErrorHandling(
      this.logger,
      '게시글 삭제',
    )(async () => {
      const post = await this.getPostById(id);
      if (post.user.indexId !== user.indexId) {
        throw new ForbiddenException('본인의 게시글만 삭제 가능합니다');
      }
      post.deletedDateTime = new Date();
      await this.postRepository.save(post);
    });
  }
}
