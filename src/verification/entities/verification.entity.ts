import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class VerificationEntity {
  @Expose()
  @ApiProperty()
  id!: number;

  @Expose()
  @ApiProperty()
  userAccountId!: number;

  @Expose()
  @ApiProperty({ description: '驗證碼' })
  code!: string;

  @Expose()
  @ApiProperty({ description: '是否有效' })
  isValid!: boolean;

  @Expose()
  @ApiProperty({ description: '建立時間' })
  createdAt!: Date;

  @Expose()
  @ApiProperty({ description: '到期時間' })
  expireAt!: Date;

  @Expose()
  @ApiProperty({ description: '使用時間' })
  usedAt?: Date;
}
