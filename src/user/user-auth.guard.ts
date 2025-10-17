import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { abort } from 'src/_libs/api-response/abort.util';
import { IS_PUBLIC_KEY } from './decorators/user-auth-public.decorator';
import { AUTH_DATA } from './decorators/auth-data.decorator';
import { AuthDataConfig } from './user-auth.interface';
import { UserAuthService } from './user-auth.service';
import { UserService } from './user.service';

@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userAuthService: UserAuthService,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    if (token === undefined) {
      throw new UnauthorizedException();
    }

    if (!(await this.userAuthService.verifyJwtToken(token))) {
      throw new UnauthorizedException('Token已過期或無效');
    }

    const payload = await this.userAuthService.getJwtPayload(token);
    const userAccountId = parseInt(payload.sub, 10);
    const user = await this.userService.findByAccountIdOrThrow({
      userAccountId,
    });
    if (!user.isEnabled) {
      abort('找無此後台使用者', HttpStatus.NOT_FOUND);
    }

    request[AUTH_DATA] = {
      payload,
      token,
    } satisfies AuthDataConfig;

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
