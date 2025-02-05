import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: '사용자 이름은 필수 입력 항목입니다.' })
  @IsString({ message: '사용자 이름은 문자열 형식이어야 합니다.' })
  userName: string;

  @IsNotEmpty({ message: '비밀번호는 필수 입력 항목입니다.' })
  @Length(6, 20, {
    message: '비밀번호는 6자 이상 20자 이하로 입력해주세요.',
  })
  userPassword: string;

  @IsNotEmpty({ message: '이메일 주소는 필수 입력 항목입니다.' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  userEmail: string;

  @IsString()
  role: string = 'USER';

  constructor(
    userName: string,
    userPassword: string,
    userEmail: string,
    role: string = 'USER',
  ) {
    this.userName = userName;
    this.userPassword = userPassword;
    this.userEmail = userEmail;
    this.role = role;
  }
}
