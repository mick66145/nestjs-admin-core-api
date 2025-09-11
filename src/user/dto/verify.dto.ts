import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { VerifyType } from '../enum/verify-type.enum';

export class VerifyDto {
  @ApiProperty({ description: '驗證token', example: 'token' })
  @IsNotEmpty()
  @IsString()
  token!: string;

  @ApiProperty({ description: '驗證碼', example: '123456' })
  @IsNotEmpty()
  @IsString()
  code!: string;
}

export class VerifyWithTypeDto extends VerifyDto {
  type!: VerifyType;
}

export class ResendVerifyDto extends PickType(VerifyDto, ['token']) {}
