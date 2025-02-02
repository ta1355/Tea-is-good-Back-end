import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  detail: string;

  @IsOptional()
  @IsString()
  imageUrl?: string; //?는 필수 값이 아님을 의미

  constructor(title: string, detail: string, imageUrl?: string) {
    this.title = title;
    this.detail = detail;
    if (imageUrl) {
      this.imageUrl = imageUrl;
    }
  }
}
