import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty({ message: '제목은 필수 입력 항목입니다.' })
  @IsString({ message: '제목은 문자열이어야 합니다.' })
  title: string;

  @IsNotEmpty({ message: '상세 내용은 필수 입력 항목입니다.' })
  @IsString({ message: '상세 내용은 문자열이어야 합니다.' })
  detail: string;

  @IsOptional()
  @IsString({ message: '잘못된 이미지 양식입니다.' })
  imageUrl?: string;

  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  category?: string;

  constructor(
    title: string,
    detail: string,
    imageUrl?: string,
    tags?: string[] | null,
    category?: string | null,
  ) {
    this.title = title;
    this.detail = detail;
    this.imageUrl = imageUrl;
    this.tags = tags ?? undefined;
    this.category = category ?? undefined;
  }
}
