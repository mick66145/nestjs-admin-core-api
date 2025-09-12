import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class SendSmsDto {
  @ApiProperty()
  @IsInt()
  @IsPositive()
  userAccountId!: number;

  @ApiPropertyOptional({
    description:
      '簡訊主旨，主旨不會隨著簡訊內容發送出去，用以註記本次發送之用途（預設空字串）',
    default: '',
  })
  @IsString()
  SB: string = '';

  @ApiProperty({ description: '簡訊內容' })
  @IsNotEmpty()
  @IsString()
  MSG!: string;

  @ApiProperty({ description: '手機號碼；多組號碼以半形逗點隔開。' })
  @IsNotEmpty()
  @IsString()
  DEST!: string;

  @ApiPropertyOptional({
    description:
      '預約時間，格式為yyyyMMddHHmmss，若要立即發送，請用空字串（預設空字串）',
    default: '',
  })
  @IsString()
  ST: string = '';

  @ApiPropertyOptional({ description: '有效期限；預設為 1440，單位：分鐘。' })
  @IsOptional()
  @IsString()
  RETRYTIME?: string;
}
