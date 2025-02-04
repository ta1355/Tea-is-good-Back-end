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

  @Column({ default: 'USER' })
  role: string;

  @CreateDateColumn()
  createDateTime!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedDateTime!: Date | null;

  @OneToMany(() => Post, (post) => post.user)
  posts?: Post[];

  @OneToMany(() => JobPosting, (jobPosting) => jobPosting.user)
  jobPostings?: JobPosting[];

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

  softDelete() {
    this.deletedDateTime = new Date();
  }

  isDeleted(): boolean {
    return this.deletedDateTime !== null;
  }

  isActive(): boolean {
    return this.deletedDateTime === null;
  }
}
