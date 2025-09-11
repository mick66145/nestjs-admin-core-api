import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterDto {
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
  @IsString()
  email!: string;
}

export class RegisterWithOrgIdDto extends RegisterDto {
  orgId?: number;
}
