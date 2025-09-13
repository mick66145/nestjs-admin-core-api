import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthDataConfig } from '../user-auth.interface';

export const AUTH_DATA = 'authData';

export const AuthData = createParamDecorator(
  (data: keyof AuthDataConfig, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const authData = <AuthDataConfig>request[AUTH_DATA];

    return data ? authData?.[data] : authData;
  },
);
