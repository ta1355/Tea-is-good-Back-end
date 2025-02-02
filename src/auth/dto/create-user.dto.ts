import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  userName: string;

  @IsNotEmpty()
  @Length(6, 20)
  userPassword: string;

  @IsEmail()
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
