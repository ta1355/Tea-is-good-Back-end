import { IsNotEmpty, IsString } from 'class-validator';

export class CreateEmploymentTypeDto {
  @IsNotEmpty({ message: '지역 리스트 이름을 입력해주세요.' })
  @IsString({ message: '문자열로 작성해주세요.' })
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}
