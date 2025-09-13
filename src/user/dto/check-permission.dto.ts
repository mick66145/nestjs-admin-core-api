import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum } from 'class-validator';
import { Permission } from 'src/libs/permission/enums/permission.enum';

export class CheckPermissionDto {
  @ApiProperty({ type: 'string', description: '驗證權限，以","分隔' })
  @IsEnum(Permission, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value.split(',')), {
    toClassOnly: true,
  })
  permissions!: Permission[];
}
