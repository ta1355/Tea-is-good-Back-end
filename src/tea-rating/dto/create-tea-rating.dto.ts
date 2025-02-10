import { IsNotEmpty, IsString, IsInt, IsOptional } from 'class-validator';

export class CreateTeaRatingDto {
  @IsNotEmpty({ message: '평점은 필수 입력 값입니다.' })
  @IsInt({ message: '평점은 정수여야 합니다.' })
  rating: number;

  @IsOptional()
  @IsString({ message: '상태는 문자열이어야 합니다.' })
  status: string = 'active';

  @IsNotEmpty({ message: '위치는 필수 입력 값입니다.' })
  @IsString({ message: '위치는 문자열이어야 합니다.' })
  location: string;

  @IsNotEmpty({ message: '리뷰는 필수 입력 값입니다.' })
  @IsString({ message: '리뷰는 문자열이어야 합니다.' })
  review: string;

  @IsNotEmpty({ message: '사용자 ID(userId)는 필수 입력 값입니다.' })
  @IsInt({ message: '사용자 ID(userId)는 정수여야 합니다.' })
  userId: number;

  constructor(
    rating: number,
    location: string,
    userId: number,
    review: string,
    status?: string,
  ) {
    this.rating = rating;
    this.location = location;
    this.userId = userId;
    this.review = review;
    if (status) {
      this.status = status;
    }
  }
}
