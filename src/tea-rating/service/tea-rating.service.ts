import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TeaRating } from '../entity/tea-rating.entity';
import { Repository } from 'typeorm';
import { CreateTeaRatingDto } from '../dto/create-tea-rating.dto';
import { withErrorHandling } from 'src/common/errors';
import { User, UserRole } from 'src/auth/entity/user.entity';
import { UpdateTeaRatingDto } from '../dto/update-tea-rating.dto';

@Injectable()
export class TeaRatingSerivce {
  private readonly logger = new Logger(TeaRatingSerivce.name);
  constructor(
    @InjectRepository(TeaRating)
    private teaRatingRepository: Repository<TeaRating>,
  ) {}

  async createTeaRating(
    dto: CreateTeaRatingDto,
    user: User,
  ): Promise<TeaRating> {
    return withErrorHandling(
      this.logger,
      '티슐랭 생성',
    )(async () => {
      const teaRating = this.teaRatingRepository.create({
        ...dto,
        user,
      });
      return await this.teaRatingRepository.save(teaRating);
    });
  }

  async getAllTeaRating(
    page: number = 1,
    limit: number = 10,
  ): Promise<TeaRating[]> {
    return withErrorHandling(
      this.logger,
      '티슐랭 전체 조회',
    )(async () => {
      const teaRating = await this.teaRatingRepository
        .createQueryBuilder('teaRating')
        .leftJoinAndSelect('teaRating.user', 'user')
        .select(['teaRating', 'user.userName'])
        .where('teaRating.deletedDateTime IS NULL')
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();
      return teaRating;
    });
  }

  async getTeaRatingById(id: number): Promise<TeaRating> {
    return withErrorHandling(
      this.logger,
      '티슐랭 상세 조회',
    )(async () => {
      const teaRating = await this.teaRatingRepository
        .createQueryBuilder('teaRating')
        .leftJoinAndSelect('teaRating.user', 'user')
        .select(['teaRating', 'user.userName', 'user.indexId'])
        .where('teaRating.id = :id AND teaRating.deletedDateTime IS NULL', {
          id,
        })
        .getOne();

      if (!teaRating) {
        throw new NotFoundException('검색한 티슐랭을 찾을 수 없습니다.');
      }
      return teaRating;
    });
  }

  async updateTeaRating(
    id: number,
    dto: UpdateTeaRatingDto,
    user: User,
  ): Promise<TeaRating> {
    return withErrorHandling(
      this.logger,
      '티슐랭 수정',
    )(async () => {
      const teaRating = await this.getTeaRatingById(id);
      if (teaRating.user.indexId !== user.indexId) {
        throw new ForbiddenException('본인이 작성한 티슐랭만 수정 가능합니다.');
      }
      return this.teaRatingRepository.save({ ...teaRating, ...dto });
    });
  }

  async deleteTeaRating(id: number, user: User): Promise<void> {
    return withErrorHandling(
      this.logger,
      '티슐랭 삭제',
    )(async () => {
      const teaRating = await this.getTeaRatingById(id);
      if (teaRating.user.indexId !== user.indexId) {
        throw new ForbiddenException('본인이 작성한 티슐랭만 삭제 가능합니다.');
      }
      teaRating.deletedDateTime = new Date();
      await this.teaRatingRepository.save(teaRating);
    });
  }

  async deleteTeaRatingByAdmin(id: number, user: User): Promise<void> {
    return withErrorHandling(
      this.logger,
      '어드민 전용 티슐랭 삭제',
    )(async () => {
      const teaRating = await this.getTeaRatingById(id);
      if (user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('어드민만 사용가능한 기능입니다.');
      }
      teaRating.deletedDateTime = new Date();
      await this.teaRatingRepository.save(teaRating);
    });
  }
}
