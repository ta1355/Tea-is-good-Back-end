import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { User } from 'src/auth/entity/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('post')
export class Post {
  @PrimaryGeneratedColumn()
  indexId: number;

  @Column()
  @IsNotEmpty()
  @IsString()
  title: string;

  @Column('text')
  @IsNotEmpty()
  detail: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  category: string;

  @Column('simple-array', { nullable: true })
  @IsOptional()
  @IsString({ each: true })
  tags: string[];

  @Column({ default: false })
  @IsBoolean()
  deleted: boolean;

  @CreateDateColumn()
  createDateTime: Date;

  @DeleteDateColumn({ nullable: true })
  deletedDateTime: Date | null;

  @UpdateDateColumn()
  updatedDateTime: Date;

  @Column({ default: 'draft' })
  @IsString()
  status: 'draft' | 'published' | 'private';

  @Column({ default: 0 })
  @IsNumber()
  likeCount: number;

  @Column({ nullable: true })
  @IsOptional()
  imageUrl: string;

  @Column({ default: 0 })
  @IsNumber()
  viewCount: number;

  @ManyToOne(() => User, (user: User) => user.posts)
  user: User;

  incrementViewCount() {
    this.viewCount += 1;
  }

  incrementLikeCount() {
    this.likeCount += 1;
  }

  decrementLikeCount() {
    if (this.likeCount > 0) {
      this.likeCount -= 1;
    }
  }

  isDeleted(): boolean {
    return this.deletedDateTime !== null;
  }
}
