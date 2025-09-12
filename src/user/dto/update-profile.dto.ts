import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import { Sometimes } from 'src/_libs/validator/sometimes.decorator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: '管理員名稱', example: '管理員名稱' })
  @Sometimes()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '手機', example: '0912345678' })
  @Sometimes()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'email', example: 'example@mail.com' })
  @Sometimes()
  @IsEmail()
  email?: string;
}
