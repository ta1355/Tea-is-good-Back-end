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

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  indexId: number; // 기본키, 사용자 고유 ID

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
  createDateTime: Date;

  @DeleteDateColumn({ nullable: true })
  deletedDateTime: Date | null;

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

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
