import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LineLoginDto {
  @ApiProperty({ description: '要驗證的 token' })
  @IsNotEmpty()
  @IsString()
  accessToken!: string;
}

export class LineLoginWithOrgIdDto extends LineLoginDto {
  orgId?: number;
}
