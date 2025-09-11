import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'account' })
  @IsNotEmpty()
  @IsString()
  account!: string;

  @ApiProperty({ example: 'password' })
  @IsNotEmpty()
  @IsString()
  password!: string;
}
