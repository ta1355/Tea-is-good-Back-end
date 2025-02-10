import { IsNotEmpty, IsString } from 'class-validator';
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

@Entity('tea_rating')
export class TeaRating {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('int')
  @IsNotEmpty()
  rating: number;

  @Column({ default: 'active' })
  @IsString()
  status: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  location: string;

  @Column('text', { nullable: true })
  @IsString()
  @IsNotEmpty()
  review: string;

  @ManyToOne(() => User, (user: User) => user.teaRatings)
  user!: User;

  @CreateDateColumn()
  createDateTime!: Date;

  @UpdateDateColumn()
  updatedDateTime!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedDateTime!: Date | null;

  constructor(
    rating: number,
    location: string,
    user: User,
    status: string = 'active',
    review: string,
  ) {
    this.rating = rating;
    this.location = location;
    this.user = user;
    this.status = status;
    this.review = review;
  }
}
