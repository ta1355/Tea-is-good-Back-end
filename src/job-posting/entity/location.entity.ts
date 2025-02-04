import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { JobPosting } from './job-posting.entity';

@Entity('location')
export class Location {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 50 })
  name: string; // 예: '서울', '부산'

  @OneToMany(() => JobPosting, (jobPosting) => jobPosting.location, {
    nullable: true,
  })
  jobPostings?: JobPosting[] | null = null;

  constructor(name: string) {
    this.name = name;
  }
}
