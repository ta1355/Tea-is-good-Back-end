import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EmploymentType } from '../entity/employment-type.entity';
import { Repository } from 'typeorm';
import { CreateEmploymentTypeDto } from '../dto/create-employment-type.dto';
import { withErrorHandling } from 'src/common/errors';

@Injectable()
export class EmploymentTypeService {
  private readonly logger = new Logger(EmploymentTypeService.name);

  constructor(
    @InjectRepository(EmploymentType)
    private readonly employmentTypeRepository: Repository<EmploymentType>,
  ) {}

  async createEmployment(dto: CreateEmploymentTypeDto): Promise<void> {
    return withErrorHandling(
      this.logger,
      '고용 유형 생성',
    )(async () => {
      const employmentType = this.employmentTypeRepository.create({
        ...dto,
      });
      await this.employmentTypeRepository.save(employmentType);
    });
  }

  async getAllEmploymentType() {
    return this.employmentTypeRepository.find();
  }

  async deleteEmploymentType(id: number) {
    const result = await this.employmentTypeRepository.delete(id);
    if (result.affected === 0) {
      throw new Error(`Location id : ${id} not found.`);
    }
    return result;
  }
}
