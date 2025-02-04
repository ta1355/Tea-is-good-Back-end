import { Entity, OneToMany, PrimaryGeneratedColumn, Column } from 'typeorm';
import { JobPosting } from './job-posting.entity';

@Entity('employment_type')
export class EmploymentType {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 20 })
  name: string; // 예: '신입', '경력'

  @OneToMany(() => JobPosting, (jobPosting) => jobPosting.location, {
    nullable: true,
  })
  jobPostings?: JobPosting[] | null = null;

  constructor(name: string) {
    this.name = name;
  }
}
