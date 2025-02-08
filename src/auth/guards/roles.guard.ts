import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { User } from 'src/auth/entity/user.entity';
import { ROLES_KEY } from 'src/common/decorators/roles.decorator';

interface RequestWithUser extends Request {
  user: User;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 라우트 핸들러에 설정된 역할 메타데이터를 가져옵니다.
    const requiredRoles = this.reflector.get<string[]>(
      ROLES_KEY,
      context.getHandler(),
    );
    if (!requiredRoles) {
      return true; // 역할이 지정되지 않은 경우 접근 허용
    }

    // 타입을 RequestWithUser로 지정해 요청 객체에서 user가 확실히 User 타입임을 보장합니다.
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('사용자 정보를 찾을 수 없습니다.');
    }

    // 사용자의 role이 지정된 requiredRoles 배열에 포함되어 있는지 확인합니다.
    return requiredRoles.includes(user.role);
  }
}
