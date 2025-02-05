import {
  HttpException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

export const withErrorHandling =
  (logger: Logger, context: string) =>
  async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      handleError(error, logger, context);
      throw mapToAppropriateException(error, context);
    }
  };
const handleError = (error: unknown, logger: Logger, context: string) => {
  if (error instanceof Error) {
    logger.error(`[${context}] 실패: ${error.message}`, error.stack);
  }
};

const mapToAppropriateException = (error: unknown, context: string) => {
  if (error instanceof HttpException) return error;
  return new InternalServerErrorException(`${context} 처리 중 오류 발생`);
};
