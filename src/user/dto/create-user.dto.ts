import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiSchema } from 'src/_libs/swagger/api-schema';

@ApiSchema({ prefix: 'CreateUserDto' })
export class RoleDto {
  @ApiProperty({ description: '角色id', example: 1 })
  @IsNotEmpty()
  @IsInt()
  id!: number;
}

export class CreateUserDto {
  @ApiProperty({ description: '帳號', example: 'account' })
  @IsNotEmpty()
  @IsString()
  account!: string;

  @ApiProperty({ description: '密碼', example: 'password' })
  @IsNotEmpty()
  @IsString()
  password!: string;

  @ApiProperty({ description: '會員名稱', example: '會員名稱' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ description: '手機', example: '0912345678' })
  @IsNotEmpty()
  @IsString()
  phone!: string;

  @ApiProperty({ description: 'Email', example: 'example@mail.com' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsBoolean()
  isValid: boolean = true;

  @ApiProperty({ description: '是否已啟用', default: true })
  @IsBoolean()
  isEnabled: boolean = true;

  @ApiProperty({ type: RoleDto })
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => RoleDto)
  role!: RoleDto;
}

export class CreateRootUserDto extends OmitType(CreateUserDto, ['role']) {}
