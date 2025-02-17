import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Magazine } from '../entity/magazine.entity';
import { Repository } from 'typeorm';
import { CreateMagazineDto } from '../dto/create-magazine.dto';
import { User } from 'src/auth/entity/user.entity';
import { withErrorHandling } from 'src/common/errors';

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
        .where('magazine.deletedDateTume IS NULL')
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
}
