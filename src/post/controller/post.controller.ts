import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PostService } from '../service/post.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreatePostDto } from '../dto/create-post.dto';
import { User } from 'src/auth/entity/user.entity';
import { UpdatePostDto } from '../dto/update-post.dto';
import { handleControllerError } from 'src/common/errors';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createPostDto: CreatePostDto,
    @Req() req: RequestWithUser,
  ) {
    try {
      return await this.postService.createPost(createPostDto, req.user);
    } catch (error: unknown) {
      throw handleControllerError(error, 'Failed to create post');
    }
  }

  @Get()
  async findAll(@Query('page') page: number, @Query('limit') limit: number) {
    try {
      return await this.postService.getAllPosts(page, limit);
    } catch (error: unknown) {
      throw handleControllerError(error, 'Failed to fetch posts');
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.postService.getPostById(+id);
    } catch (error: unknown) {
      throw handleControllerError(error, 'Failed to fetch post');
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @Req() req: RequestWithUser,
  ) {
    try {
      return await this.postService.updatePost(+id, updatePostDto, req.user);
    } catch (error: unknown) {
      throw handleControllerError(error, 'Failed to update post');
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    try {
      return await this.postService.deletePost(+id, req.user);
    } catch (error: unknown) {
      throw handleControllerError(error, 'Failed to delete post');
    }
  }
}
