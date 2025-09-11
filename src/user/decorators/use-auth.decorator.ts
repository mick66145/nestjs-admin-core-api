import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserAuthGuard } from '../user-auth.guard';

export function UseAuth() {
  return applyDecorators(UseGuards(UserAuthGuard), ApiBearerAuth());
}
