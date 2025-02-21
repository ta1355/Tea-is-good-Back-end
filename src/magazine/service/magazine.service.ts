import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Magazine } from '../entity/magazine.entity';
import { Repository } from 'typeorm';
import { CreateMagazineDto } from '../dto/create-magazine.dto';
import { User } from 'src/auth/entity/user.entity';
import { withErrorHandling } from 'src/common/errors';
import { UpdateMagazineDto } from '../dto/update-magazine.dto';

@Injectable()
export class MagazineService {
  private readonly logger = new Logger(MagazineService.name);

  constructor(
    @InjectRepository(Magazine)
    private magazineRepository: Repository<Magazine>,
  ) {}

  async createMagazine(dto: CreateMagazineDto, user: User): Promise<Magazine> {
    return withErrorHandling(
      this.logger,
      '메거진 생성',
    )(async () => {
      const magazine = this.magazineRepository.create({
        ...dto,
        user,
        tags: dto.tags ?? null,
        category: dto.category,
      });
      return await this.magazineRepository.save(magazine);
    });
  }

  async getAllMagazine(
    page: number = 1,
    limit: number = 10,
  ): Promise<Magazine[]> {
    return withErrorHandling(
      this.logger,
      '메거진 목록 조회',
    )(async () => {
      const magazines = await this.magazineRepository
        .createQueryBuilder('magazine')
        .leftJoinAndSelect('magazine.user', 'user')
        .select(['magazine', 'magazine.userName'])
        .where('magazine.deletedDateTime IS NULL')
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();
      return magazines;
    });
  }

  async getMagazineById(id: number): Promise<Magazine> {
    return withErrorHandling(
      this.logger,
      '메거진 상세 조회',
    )(async () => {
      const magazine = await this.magazineRepository
        .createQueryBuilder('magazine')
        .leftJoinAndSelect('magazine.user', 'user')
        .select(['magazine', 'user.userName', 'user.indexId'])
        .where('magazine.indexId = :id AND magazine.deletedDateTime IS NULL', {
          id,
        })
        .getOne();

      if (!magazine) {
        throw new NotFoundException('메거진을 찾을 수 없습니다.');
      }
      return magazine;
    });
  }

  async updateMagazine(
    id: number,
    dto: UpdateMagazineDto,
    user: User,
  ): Promise<Magazine> {
    return withErrorHandling(
      this.logger,
      '메거진 수정',
    )(async () => {
      const magazine = await this.getMagazineById(id);

      if (magazine.user.indexId !== user.indexId) {
        throw new ForbiddenException(
          '본인이 작성한 메거지만 수정이 가능합니다.',
        );
      }

      const updatedMagazine = {
        ...magazine,
        ...dto,
      };
      return this.magazineRepository.save(updatedMagazine);
    });
  }

  async deletedMagazine(id: number, user: User): Promise<void> {
    return withErrorHandling(
      this.logger,
      '메거진 삭제',
    )(async () => {
      const magazine = await this.getMagazineById(id);
      if (magazine.user.indexId !== user.indexId) {
        throw new ForbiddenException('본인의 메거진만 삭제 가능합니다.');
      }

      magazine.deletedDateTime = new Date();
      await this.magazineRepository.save(magazine);
    });
  }
}
