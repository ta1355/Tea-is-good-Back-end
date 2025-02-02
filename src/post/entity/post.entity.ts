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
  indexId!: number;

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
  category?: string;

  @Column('simple-array', { nullable: true })
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @Column({ default: false })
  @IsBoolean()
  deleted: boolean;

  @CreateDateColumn()
  createDateTime!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedDateTime!: Date | null;

  @UpdateDateColumn()
  updatedDateTime!: Date;

  @Column({ default: 'draft' })
  @IsString()
  status: 'draft' | 'published' | 'private';

  @Column({ default: 0 })
  @IsNumber()
  likeCount: number;

  @Column({ nullable: true })
  @IsOptional()
  imageUrl?: string; // 선택적 필드

  @Column({ default: 0 })
  @IsNumber()
  viewCount: number;

  @ManyToOne(() => User, (user: User) => user.posts)
  user!: User;

  // 생성자 추가
  constructor(
    title: string,
    detail: string,
    status: 'draft' | 'published' | 'private' = 'draft',
    likeCount: number = 0,
    viewCount: number = 0,
    deleted: boolean = false,
    category?: string,
    tags?: string[],
    imageUrl?: string,
    user?: User,
  ) {
    this.title = title;
    this.detail = detail;
    this.status = status;
    this.likeCount = likeCount;
    this.viewCount = viewCount;
    this.deleted = deleted; // 기본값은 false
    if (category) this.category = category;
    if (tags) this.tags = tags;
    if (imageUrl) this.imageUrl = imageUrl;
    if (user) this.user = user!;
  }

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
