import { Module } from '@nestjs/common';
import { PermissionModule } from 'src/libs/permission/permission.module';
import { UserModule } from 'src/user/user.module';
import { RoleService } from './role.service';
import { UserRoleService } from './user-role.service';
import { RoleController } from './role.controller';

@Module({
  imports: [UserModule, PermissionModule],
  controllers: [RoleController],
  providers: [RoleService, UserRoleService],
  exports: [RoleService, UserRoleService],
})
export class RoleModule {}
