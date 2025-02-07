import {
  HttpException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

const logError = (error: unknown, logger: Logger, context: string) => {
  if (error instanceof Error) {
    logger.error(`[${context}] 실패: ${error.message}`, error.stack);
  }
};

const mapToAppropriateException = (error: unknown, context: string) => {
  if (error instanceof HttpException) return error;
  return new InternalServerErrorException(`${context} 처리 중 오류 발생`);
};

// 서비스에서 자주 사용하는 에러처리
export const withErrorHandling =
  (logger: Logger, context: string) =>
  async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      logError(error, logger, context);
      throw mapToAppropriateException(error, context);
    }
  };

//컨트롤러에서 자주 사용하는 에러처리
export const handleControllerError = (
  error: unknown,
  defaultMessage: string,
) => {
  if (error instanceof HttpException) {
    return error;
  }
  return new InternalServerErrorException({
    statusCode: 500,
    message: defaultMessage,
    details: error instanceof Error ? error.message : 'Unknown error occurred',
  });
};
