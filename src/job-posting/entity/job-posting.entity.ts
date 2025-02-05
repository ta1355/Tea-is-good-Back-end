import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { EmploymentType } from './employment-type.entity';
import { Location } from './location.entity';
import { User } from 'src/auth/entity/user.entity';

@Entity('job_posting')
export class JobPosting {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  title: string;

  @Column({ length: 100 })
  companyName: string;

  @ManyToOne(() => Location, (location) => location.jobPostings)
  @JoinColumn({ name: 'locationId' })
  location: Location; // 태그별 회사 위치 ex)서울, 부산

  @Column({ length: 255 })
  detailLocation: string;

  @Column('text')
  description: string;

  @Column({ type: 'date' })
  recruitmentStartDate: Date;

  @Column({ type: 'date' })
  recruitmentEndDate: Date;

  @Column({ length: 50 })
  jobTitle: string;

  @ManyToOne(
    () => EmploymentType,
    (employmentType) => employmentType.jobPostings,
  )
  @JoinColumn({ name: 'employmentTypeId' })
  employmentType: EmploymentType;

  @Column('decimal', { precision: 10, scale: 2 })
  annualSalary: number; // 연간 급여 (단위: 만원)

  @Column('simple-array')
  preferredSkills?: string[]; // 우대 기술

  @Column('simple-array')
  tags?: string[]; // 태그 (문자열 배열)

  @Column({ length: 50, nullable: true })
  contactInfo?: string; // 담당자 연락처 (선택적)

  @CreateDateColumn()
  createdAt!: Date; // 공고 생성일

  @UpdateDateColumn()
  updatedAt!: Date; // 공고 수정일

  @Column({ default: 0 })
  viewCount: number; // 조회수

  @Column({
    type: 'varchar',
    length: 20,
    default: 'active',
  })
  status: 'active' | 'private' | 'expired';

  @ManyToOne(() => User, (user) => user.jobPostings)
  @JoinColumn({ name: 'indexId' })
  user: User;

  constructor(
    title: string,
    companyName: string,
    location: Location,
    detailLocation: string,
    description: string,
    recruitmentStartDate: Date,
    recruitmentEndDate: Date,
    jobTitle: string,
    employmentType: EmploymentType,
    annualSalary: number,
    user: User,
    preferredSkills?: string[],
    tags?: string[],
    contactInfo?: string,
    status: 'active' | 'private' | 'expired' = 'active',
    viewCount = 0,
  ) {
    this.title = title;
    this.companyName = companyName;
    this.location = location;
    this.detailLocation = detailLocation;
    this.description = description;
    this.recruitmentStartDate = recruitmentStartDate;
    this.recruitmentEndDate = recruitmentEndDate;
    this.jobTitle = jobTitle;
    this.employmentType = employmentType;
    this.annualSalary = annualSalary;
    this.user = user;

    if (preferredSkills) {
      this.preferredSkills = preferredSkills;
    }
    if (tags) {
      this.tags = tags;
    }
    if (contactInfo) {
      this.contactInfo = contactInfo;
    }

    this.status = status;
    this.viewCount = viewCount;
  }
}
