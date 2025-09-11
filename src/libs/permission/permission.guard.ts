import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { abort } from 'src/_libs/api-response/abort.util';
import { AUTH_DATA } from 'src/user/decorators/auth-data.decorator';
import { AuthDataConfig } from 'src/user/user-auth.interface';
import { PermissionService } from './permission.service';
import { Permission } from './enums/permission.enum';
import { USE_PERMISSION } from './decorators/use-permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const authData = <AuthDataConfig>request[AUTH_DATA];

    if (authData === undefined) {
      // 若未在PermissionGuard之前執行AuthGuard會導致無法正常取得登入者資訊
      abort('無法取得登入者資訊', HttpStatus.UNAUTHORIZED);
    }

    const { payload } = authData;

    // 檢查登入者權限
    const needPermission = <Permission[]>(
      this.reflector.getAllAndMerge(USE_PERMISSION, [
        context.getClass(),
        context.getHandler(),
      ])
    );

    if (needPermission.length === 0) {
      return true;
    }

    await this.permissionService.checkByUser(
      parseInt(payload.sub),
      needPermission,
    );

    return true;
  }
}
