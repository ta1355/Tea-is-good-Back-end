import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles'; // 메타데이터 키 정의
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles); //
