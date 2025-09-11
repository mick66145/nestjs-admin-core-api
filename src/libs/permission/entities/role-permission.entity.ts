import { Exclude, Expose, Type } from 'class-transformer';
import { PermissionAction, PermissionActionName } from '../permission-set-list';
import { ApiSchema } from 'src/_libs/swagger/api-schema';
import { ApiProperty } from '@nestjs/swagger';
import { Permission } from '../enums/permission.enum';

@ApiSchema({ prefix: 'PermissionMenuEntity.PermissionFeatureEntity' })
@Exclude()
export class PermissionEntity {
  @ApiProperty({ description: '操作', enum: PermissionAction })
  @Expose()
  action!: PermissionAction;

  @ApiProperty({
    description: '權限名稱-顯示文字',
    example: '權限名稱-顯示文字',
  })
  @Expose()
  displayName!: string;

  @ApiProperty({ description: '權限名稱', enum: Permission })
  @Expose()
  name!: Permission;
}

@ApiSchema({ prefix: 'PermissionMenuEntity' })
@Exclude()
export class PermissionFeatureEntity {
  @ApiProperty({
    description: '功能名稱-顯示文字',
    example: '功能名稱-顯示文字',
  })
  @Expose()
  displayName!: string;

  @ApiProperty({ description: '功能名稱', example: '功能名稱' })
  @Expose()
  featureName!: string;

  @ApiProperty({
    description: '功能權限',
    type: PermissionEntity,
    isArray: true,
  })
  @Expose()
  @Type(() => PermissionEntity)
  permission!: PermissionEntity[];
}

@ApiSchema({ prefix: 'PermissionMenuEntity' })
@Exclude()
export class PermissionActionEntity {
  @ApiProperty({ description: '操作名稱', enum: PermissionAction })
  @Expose()
  name!: PermissionAction;

  @ApiProperty({ description: '顯示文字', enum: PermissionActionName })
  @Expose()
  displayName!: PermissionActionName;
}

@Exclude()
export class RolePermissionEntity {
  @ApiProperty({
    description: '操作列表',
    type: PermissionActionEntity,
    isArray: true,
  })
  @Expose()
  @Type(() => PermissionActionEntity)
  action!: PermissionActionEntity[];

  @ApiProperty({
    description: '功能列表',
    type: PermissionFeatureEntity,
    isArray: true,
  })
  @Expose()
  @Type(() => PermissionFeatureEntity)
  menu!: PermissionFeatureEntity[];
}
