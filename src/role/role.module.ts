import { Module } from '@nestjs/common';
import { PermissionModule } from 'src/libs/permission/permission.module';
import { UserAccountModule } from 'src/user-account/user-account.module';
import { RoleService } from './role.service';
import { UserRoleService } from './user-role.service';
import { RoleController } from './role.controller';

@Module({
  imports: [UserAccountModule, PermissionModule],
  controllers: [RoleController],
  providers: [RoleService, UserRoleService],
  exports: [RoleService, UserRoleService],
})
export class RoleModule {}
