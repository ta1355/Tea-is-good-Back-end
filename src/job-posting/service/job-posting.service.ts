import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JobPosting } from '../entity/job-posting.entity';
import { Repository, Between, Like, FindManyOptions } from 'typeorm';
import { CreateJobPostingDto } from '../dto/create-job-posting.dto';
import { UpdateJobPostingDto } from '../dto/update-job-posting.dto';
import { User } from 'src/auth/entity/user.entity';
import { JobPostingResponse } from '../dto/job-posting-response.dto';
import { withErrorHandling } from 'src/common/errors';

@Injectable()
export class JobPostingService {
  private readonly logger = new Logger(JobPostingService.name);
  private readonly allowedUpdateFields = [
    'title',
    'companyName',
    'detailLocation',
    'description',
    'recruitmentStartDate',
    'recruitmentEndDate',
    'jobTitle',
    'annualSalary',
    'preferredSkills',
    'tags',
    'contactInfo',
    'status',
  ];

  constructor(
    @InjectRepository(JobPosting)
    private readonly jobPostingRepository: Repository<JobPosting>,
  ) {}

  // 구인공고 생성
  async createJobPosting(
    dto: CreateJobPostingDto,
    user: User,
  ): Promise<JobPostingResponse> {
    return withErrorHandling(
      this.logger,
      '구인공고 생성',
    )(async () => {
      const posting = this.jobPostingRepository.create({
        ...dto,
        user,
        status: 'active',
      });

      const saved = await this.jobPostingRepository.save(posting);
      return this.toResponseDTO(saved);
    });
  }

  // 구인공고 전체 조회 (페이지네이션 + 필터링)
  async getAllJobPostings(
    page: number = 1,
    limit: number = 10,
    search?: string,
    locationId?: number,
    employmentTypeId?: number,
    minSalary?: number,
    maxSalary?: number,
  ): Promise<{ data: JobPostingResponse[]; total: number }> {
    return withErrorHandling(
      this.logger,
      '구인공고 목록 조회',
    )(async () => {
      const where: FindManyOptions<JobPosting>['where'] = {
        status: 'active',
      };

      if (search) {
        where.title = Like(`%${search}%`);
        where.companyName = Like(`%${search}%`);
      }

      if (locationId) where.location = { id: locationId };
      if (employmentTypeId) where.employmentType = { id: employmentTypeId };
      if (minSalary || maxSalary) {
        where.annualSalary = Between(
          minSalary || 0,
          maxSalary || Number.MAX_SAFE_INTEGER,
        );
      }

      const [data, total] = await this.jobPostingRepository.findAndCount({
        where,
        relations: ['user', 'location', 'employmentType'],
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        data: data.map((post) => this.toResponseDTO(post)),
        total,
      };
    });
  }

  // 구인공고 상세 조회
  async getJobPostingById(id: number): Promise<JobPostingResponse> {
    return withErrorHandling(
      this.logger,
      '구인공고 상세 조회',
    )(async () => {
      const posting = await this.jobPostingRepository.findOne({
        where: { id, status: 'active' },
        relations: ['user', 'location', 'employmentType'],
      });

      if (!posting) {
        throw new NotFoundException('구인공고를 찾을 수 없습니다');
      }

      await this.jobPostingRepository.update(id, {
        viewCount: () => 'view_count + 1',
      });

      return this.toResponseDTO(posting);
    });
  }

  // 구인공고 수정
  async updateJobPosting(
    id: number,
    dto: UpdateJobPostingDto,
    user: User,
  ): Promise<JobPostingResponse> {
    return withErrorHandling(
      this.logger,
      '구인공고 수정',
    )(async () => {
      const posting = await this.jobPostingRepository.findOne({
        where: { id },
        relations: ['user'],
      });

      if (!posting) {
        throw new NotFoundException('구인공고를 찾을 수 없습니다');
      }

      if (posting.user.indexId !== user.indexId) {
        throw new ForbiddenException('본인의 공고만 수정할 수 있습니다');
      }

      // 상태 유효성 검사 추가
      if (
        dto.status &&
        !['active', 'private', 'expired'].includes(dto.status)
      ) {
        throw new BadRequestException('유효하지 않은 상태 값입니다');
      }

      const filteredUpdate = (
        Object.keys(dto) as Array<keyof UpdateJobPostingDto>
      )
        .filter((key) => this.allowedUpdateFields.includes(key))
        .reduce(
          (obj, key) => ({
            ...obj,
            [key]: dto[key],
          }),
          {} as Partial<UpdateJobPostingDto>,
        );

      const updated = await this.jobPostingRepository.save({
        ...posting,
        ...filteredUpdate,
      });

      return this.toResponseDTO(updated);
    });
  }

  // DTO 변환 헬퍼
  private toResponseDTO(posting: JobPosting): JobPostingResponse {
    return {
      id: posting.id,
      title: posting.title,
      companyName: posting.companyName,
      location: posting.location.name,
      detailLocation: posting.detailLocation,
      description: posting.description,
      recruitmentPeriod: {
        start: posting.recruitmentStartDate,
        end: posting.recruitmentEndDate,
      },
      jobTitle: posting.jobTitle,
      employmentType: posting.employmentType.name,
      salary: posting.annualSalary,
      preferredSkills: posting.preferredSkills || [],
      tags: posting.tags || [],
      contactInfo: posting.contactInfo,
      views: posting.viewCount,
      status: posting.status,
      author: {
        id: posting.user.indexId,
        name: posting.user.userName,
        email: posting.user.userEmail,
      },
      createdAt: posting.createdAt,
      updatedAt: posting.updatedAt,
    };
  }
}
