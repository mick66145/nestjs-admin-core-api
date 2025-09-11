import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, ValidateNested } from 'class-validator';
import { ApiSchema } from 'src/_libs/swagger/api-schema';

@ApiSchema({ prefix: 'UpdateUserRoleDto' })
export class RoleDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  id!: number;
}

export class UpdateUserRoleDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  userAccountId!: number;

  @ApiProperty({ type: RoleDto, isArray: true })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleDto)
  role!: RoleDto[];
}
