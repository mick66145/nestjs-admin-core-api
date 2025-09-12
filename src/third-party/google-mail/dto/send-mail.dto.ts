import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class SendMailDto {
  @ApiProperty()
  @IsInt()
  @IsPositive()
  userAccountId!: number;

  @ApiProperty({ description: '主旨' })
  @IsNotEmpty()
  @IsString()
  subject!: string;

  @ApiProperty({ description: '內容' })
  @IsNotEmpty()
  @IsString()
  message!: string;

  @ApiProperty({ description: '收件者' })
  @IsNotEmpty()
  @IsString()
  to!: string;
}
