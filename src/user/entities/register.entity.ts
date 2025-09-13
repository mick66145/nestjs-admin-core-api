import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class RegisterEntity {
  @ApiProperty({ description: '帳號', example: 'account' })
  @Expose()
  account!: string;

  @ApiProperty({ description: '後台使用者名稱', example: '後台使用者名稱' })
  @Expose()
  name!: string;

  @ApiProperty({
    description: '驗證用token',
    example: 'token',
  })
  @Expose()
  token!: string;
}
