import { JobPosting } from '../entity/job-posting.entity';

type JobPostingStatus = 'active' | 'private' | 'expired';

export class JobPostingResponse {
  id: number;
  title: string;
  companyName: string;
  location: string;
  detailLocation: string;
  description: string;
  recruitmentPeriod: {
    start: Date;
    end: Date;
  };
  jobTitle: string;
  employmentType: string;
  salary: number;
  preferredSkills: string[];
  tags: string[];
  contactInfo?: string;
  views: number;
  status: JobPostingStatus;
  author: {
    id: number;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;

  constructor(posting: JobPosting) {
    this.id = posting.id;
    this.title = posting.title;
    this.companyName = posting.companyName;
    this.location = posting.location?.name || '미지정';
    this.detailLocation = posting.detailLocation;
    this.description = posting.description;
    this.recruitmentPeriod = {
      start: posting.recruitmentStartDate,
      end: posting.recruitmentEndDate,
    };
    this.jobTitle = posting.jobTitle;
    this.employmentType = posting.employmentType?.name || '미정';
    this.salary = posting.annualSalary;
    this.preferredSkills = posting.preferredSkills || [];
    this.tags = posting.tags || [];
    this.contactInfo = posting.contactInfo;
    this.views = posting.viewCount;
    this.status = posting.status as JobPostingStatus; // 엔티티 값 직접 할당
    this.author = {
      id: posting.user?.indexId || 0,
      name: posting.user?.userName || '알 수 없음',
      email: posting.user?.userEmail || '',
    };
    this.createdAt = posting.createdAt;
    this.updatedAt = posting.updatedAt;
  }
}
