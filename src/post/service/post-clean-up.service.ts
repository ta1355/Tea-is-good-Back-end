import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { Post } from '../entity/post.entity';

export class PostCleanUpService {
  private readonly logger = new Logger(PostCleanUpService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  // 매일 자정에 실행
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredPosts(): Promise<void> {
    const threshold = new Date();
    threshold.setMonth(threshold.getMonth() - 3); // 현재 시각에서 3개월 전
    const result = await this.postRepository
      .createQueryBuilder()
      .delete() // 하드 삭제
      .from(Post)
      .where('deletedDateTime IS NOT NULL')
      .andWhere('deletedDateTime < :threshold', { threshold })
      .execute();

    this.logger.log(
      `하드 삭제 완료: ${result.affected ?? 0}개의 포스트 삭제됨.`,
    );
  }
}
