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
}
