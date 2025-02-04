import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { JobPosting } from './job-posting.entity';

@Entity('location')
export class Location {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 50 })
  name: string; // 예: '서울', '부산'

  @OneToMany(() => JobPosting, (jobPosting) => jobPosting.location)
  jobPostings: JobPosting[];

  constructor(name: string, jobPostings: JobPosting[]) {
    this.name = name;
    this.jobPostings = jobPostings;
  }
}
