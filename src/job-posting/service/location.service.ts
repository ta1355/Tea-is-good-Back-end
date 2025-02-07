import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Location } from '../entity/location.entity';
import { Repository } from 'typeorm';
import { withErrorHandling } from 'src/common/errors';
import { CreateLocationDto } from '../dto/create-location.dto';

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);

  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {}

  async createLocationTag(dto: CreateLocationDto): Promise<void> {
    return withErrorHandling(
      this.logger,
      '지역 목록 생성',
    )(async () => {
      const location = this.locationRepository.create({
        ...dto,
      });
      await this.locationRepository.save(location);
    });
  }
}
