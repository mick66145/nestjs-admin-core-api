import { ApiProperty, PickType } from '@nestjs/swagger';
import {
  IsDefined,
  IsNotEmpty,
  IsString,
  Length,
  ValidateIf,
} from 'class-validator';

export class CreateUserAccountDto {
  @ApiProperty({ description: '帳號' })
  @IsNotEmpty()
  @IsString()
  account!: string;

  @ApiProperty({ description: '密碼' })
  @IsNotEmpty()
  @IsString()
  @Length(5, 20, { message: '密碼長度需為5~20位' })
  password!: string;
}

export class LoginDto extends PickType(CreateUserAccountDto, [
  'account',
  'password',
] as const) {}

export class UpdatePasswordDto {
  @ApiProperty({ description: '舊密碼' })
  @IsNotEmpty()
  @IsString()
  oldPassword!: string;

  @ApiProperty({ description: '新密碼' })
  @IsNotEmpty()
  @IsString()
  @Length(5, 20, { message: '密碼長度需為5~20位' })
  newPassword!: string;

  // Ref: https://stackoverflow.com/a/77811829
  @ValidateIf((o) => o.oldPassword === o.newPassword)
  @IsDefined({ message: '舊密碼不可與新密碼一致' })
  protected readonly samePassword: undefined;
}

export class ResetPasswordDto extends PickType(UpdatePasswordDto, [
  'newPassword',
] as const) {}
