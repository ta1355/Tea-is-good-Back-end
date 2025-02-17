import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { IsNotEmpty, IsEmail, Length } from 'class-validator';
import { Post } from 'src/post/entity/post.entity';
import { JobPosting } from 'src/job-posting/entity/job-posting.entity';
import { TeaRating } from 'src/tea-rating/entity/tea-rating.entity';
import { Magazine } from 'src/magazine/entity/magazine.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  EDITOR = 'EDITOR',
}

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  indexId!: number;

  @Column({ unique: true })
  @IsNotEmpty()
  userName: string;

  @Column()
  @IsNotEmpty()
  @Length(6, 20)
  userPassword: string;

  @Column({ unique: true })
  @IsEmail()
  userEmail: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @CreateDateColumn()
  createDateTime!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedDateTime!: Date | null;

  @OneToMany(() => Post, (post) => post.user)
  posts?: Post[];

  @OneToMany(() => JobPosting, (jobPosting) => jobPosting.user)
  jobPostings?: JobPosting[];

  @OneToMany(() => TeaRating, (teaRating) => teaRating.user)
  teaRatings?: TeaRating[];

  @OneToMany(() => Magazine, (magazine) => magazine.user)
  magazines?: Magazine[];

  constructor(
    userName: string,
    userPassword: string,
    userEmail: string,
    role: UserRole = UserRole.USER,
  ) {
    this.userName = userName;
    this.userPassword = userPassword;
    this.userEmail = userEmail;
    this.role = role;
  }

  softDelete = () => {
    this.deletedDateTime = new Date();
  };

  isDeleted(): boolean {
    return this.deletedDateTime !== null;
  }

  isActive(): boolean {
    return this.deletedDateTime === null;
  }
}
