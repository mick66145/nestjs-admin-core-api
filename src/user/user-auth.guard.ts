import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from './decorators/user-auth-public.decorator';
import { AUTH_DATA } from './decorators/auth-data.decorator';
import { AuthDataConfig } from './user-auth.interface';
import { UserAuthService } from './user-auth.service';

@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userAuthService: UserAuthService,
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
