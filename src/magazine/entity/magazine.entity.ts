import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
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

@Entity('magazine')
export class Magazine {
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
  tags?: string[] | null;

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
  imageUrl?: string;

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
    category?: string | null,
    tags?: string[] | null,
    imageUrl?: string,
    user?: User,
  ) {
    this.title = title;
    this.detail = detail;
    this.status = status;
    this.likeCount = likeCount;
    this.viewCount = viewCount;
    if (category) this.category = category ?? null;
    if (tags !== undefined) this.tags = tags ?? null;
    if (imageUrl !== undefined) this.imageUrl = imageUrl;
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
