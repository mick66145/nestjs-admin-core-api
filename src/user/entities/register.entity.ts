import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class RegisterEntity {
  @ApiProperty({ description: '帳號', example: 'account' })
  @Expose()
  account!: string;

  @ApiProperty({ description: '總後台管理員名稱', example: '總後台管理員名稱' })
  @Expose()
  name!: string;

  @ApiProperty({
    description: '驗證用token',
    example: 'token',
  })
  @Expose()
  token!: string;
}
