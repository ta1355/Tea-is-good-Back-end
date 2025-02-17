import { Injectable, Logger } from '@nestjs/common';
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
}
