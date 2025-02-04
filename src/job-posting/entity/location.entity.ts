import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('location')
export class Location {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 50 })
  name: string; // 예: '서울', '부산'

  @OneToMany(() => JobPosting, (jobPosting) => jobPosting.location)
  jobPostings: JobPosting[];
}
