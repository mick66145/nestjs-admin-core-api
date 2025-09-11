import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ForgetPasswordSendMethod } from '../enum/forget-password-send-method.enum';

export class ForgetPasswordTokenDto {
  @ApiProperty({ description: '驗證方式', enum: ForgetPasswordSendMethod })
  @IsNotEmpty()
  @IsEnum(ForgetPasswordSendMethod)
  method!: ForgetPasswordSendMethod;

  @ApiProperty({ description: '手機、Email', example: 'email' })
  @IsNotEmpty()
  @IsString()
  target!: string;
}

export class ForgetPasswordTokenWithOrgIdDto extends ForgetPasswordTokenDto {
  orgId?: number;
}

export class ForgetPasswordResendDto {
  @ApiProperty({ description: '驗證方式', enum: ForgetPasswordSendMethod })
  @IsNotEmpty()
  @IsEnum(ForgetPasswordSendMethod)
  method!: ForgetPasswordSendMethod;

  @ApiProperty({ description: '驗證用Token', example: 'token' })
  @IsNotEmpty()
  @IsString()
  token!: string;
}

export class ForgetPasswordVerifyDto {
  @ApiProperty({ description: '驗證用Token', example: 'token' })
  @IsNotEmpty()
  @IsString()
  token!: string;

  @ApiProperty({ description: '驗證碼', example: 'code' })
  @IsNotEmpty()
  @IsString()
  code!: string;
}

export class ForgetPasswordResetDto {
  @ApiProperty({ description: '驗證用Token', example: 'token' })
  @IsNotEmpty()
  @IsString()
  token!: string;

  @ApiProperty({ description: '新密碼', example: 'password' })
  @IsNotEmpty()
  @IsString()
  password!: string;
}
