import { ApiProperty, PickType } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
} from 'class-validator';
import { configFactory } from 'src/config/verification/verification.config';
import { CodeType } from '../verification.interface';

const { codeLength, codeType, expireMinutes } = configFactory();

export class CreateVerificationDto {
  @ApiProperty()
  @IsInt()
  @IsPositive()
  userAccountId!: number;

  @ApiProperty({ description: '驗證碼長度', default: codeLength })
  @IsInt()
  @IsPositive()
  length: number = codeLength;

  @ApiProperty({
    description: '驗證碼類型',
    enum: CodeType,
    default: codeType,
  })
  @IsEnum(CodeType)
  codeType: CodeType = codeType;

  @ApiProperty({ description: '過期分鐘數', default: expireMinutes })
  @IsInt()
  @IsPositive()
  expireMinutes: number = expireMinutes;
}

export class VerifyCodeDto extends PickType(CreateVerificationDto, [
  'userAccountId',
] as const) {
  @ApiProperty({ description: '驗證碼' })
  @IsNotEmpty()
  @IsString()
  code!: string;
}
