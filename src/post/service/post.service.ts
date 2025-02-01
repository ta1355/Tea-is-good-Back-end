import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from '../entity/post.entity';
import { IsNull, Repository } from 'typeorm';
import { CreatePostDto } from '../dto/create-post.dto';
import { User } from 'src/auth/entity/user.entity';
import { UpdatePostDto } from '../dto/update-post.dto';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  async createPost(createPostDto: CreatePostDto, user: User): Promise<Post> {
    try {
      const post = this.postRepository.create({
        ...createPostDto,
        user,
      });
      return await this.postRepository.save(post);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`게시글 생성 실패 : ${error.message}`);
      } else {
        this.logger.error('게시글 생성 실패: 알 수 없는 오류');
      }
      throw new Error('Faild to create post');
    }
  }

  async getAllPosts(page: number = 1, limit: number = 10): Promise<Post[]> {
    try {
      return this.postRepository.find({
        where: { deletedDateTime: IsNull() },
        relations: ['user'],
        take: limit,
        skip: (page - 1) * limit,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`게시글 찾기 실패 : ${error.message}`);
      } else {
        this.logger.error('게시글 찾기 실패 : 알 수 없는 오류');
      }
      throw new Error('Faild to find all post');
    }
  }

  async getPostById(id: number): Promise<Post> {
    try {
      const post = await this.postRepository.findOne({
        where: { indexId: id, deletedDateTime: IsNull() },
        relations: ['user'],
      });
      if (!post) {
        throw new NotFoundException('Post not found');
      }
      return post;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`게시글 찾기 실패 : ${error.message}`);
      } else {
        this.logger.error('게시글 찾기 실패 : 알 수 없는 오류');
      }
      throw new Error('Faild to find post');
    }
  }

  async updatePost(
    id: number,
    UpdatePostDto: UpdatePostDto,
    user: User,
  ): Promise<Post> {
    try {
      const post = await this.getPostById(id);
      if (post.user.indexId !== user.indexId) {
        throw new ForbiddenException('You can only update your own posts');
      }
      return this.postRepository.save({ ...post, ...UpdatePostDto });
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`게시글 수정 실패 : ${error.message}`);
      } else {
        this.logger.error('게시글 수정 실패 : 알 수 없는 오류');
      }
      throw new Error('Faild to update post');
    }
  }

  async deletePost(id: number, user: User): Promise<void> {
    try {
      const post = await this.getPostById(id);
      if (post.user.indexId !== user.indexId) {
        throw new ForbiddenException('You cna only delete your own posts');
      }
      post.deletedDateTime = new Date();
      await this.postRepository.save(post);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`게시글 삭제 실패 : ${error.message}`);
      } else {
        this.logger.error('게시글 삭제 실패 : 알 수 없는 오류');
      }
      throw new Error('Faild to delete post');
    }
  }
}
