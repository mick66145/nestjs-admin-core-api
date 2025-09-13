import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'token', example: 'token' })
  @IsNotEmpty()
  @IsString()
  token!: string;
}

export class VerifyTokenDto extends PickType(RefreshTokenDto, ['token']) {}
