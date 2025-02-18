import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Magazine } from './entity/magazine.entity';
import { MagazineService } from './service/magazine.service';
import { MagazineController } from './controller/magazine.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Magazine])],
  providers: [MagazineService],
  controllers: [MagazineController],
  exports: [MagazineService],
})
export class MagazineModule {}
