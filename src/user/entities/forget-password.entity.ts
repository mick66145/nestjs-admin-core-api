import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ForgetPasswordEntity {
  @ApiProperty({ description: '帳號', example: 'account' })
  @Expose()
  account!: string;

  @ApiProperty({
    description: '驗證用token',
    example: 'token',
  })
  @Expose()
  token!: string;
}

@Exclude()
export class ForgetPasswordVerifyEntity {
  @ApiProperty({
    description: '驗證用token',
    example: 'token',
  })
  @Expose()
  token!: string;
}
