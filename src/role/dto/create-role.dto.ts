import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiSchema } from 'src/_libs/swagger/api-schema';
import { Sometimes } from 'src/_libs/validator/sometimes.decorator';
import { Permission } from 'src/libs/permission/enums/permission.enum';
import { ArrayObjDistinct } from 'src/_libs/validator/array-disinct.decorator';

@ApiSchema({ prefix: 'CreateRoleDto' })
export class PermissionDto {
  @ApiProperty({ enum: Permission })
  @IsNotEmpty()
  @IsEnum(Permission)
  name!: Permission;
}

export class CreateRoleDto {
  @ApiProperty({ example: '角色名稱' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @Sometimes()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiProperty({ type: PermissionDto, isArray: true })
  @IsNotEmpty()
  @IsArray()
  @ArrayObjDistinct('name')
  @ValidateNested()
  @Type(() => PermissionDto)
  permission!: PermissionDto[];
}
