import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from 'src/post/dto/create-post.dto';

export class UpdateMagazineDto extends PartialType(CreatePostDto) {}
