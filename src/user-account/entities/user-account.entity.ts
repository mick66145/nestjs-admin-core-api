import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { AccountType } from '../user-account.interface';

@Exclude()
export class UserAccountEntity {
  @Expose()
  @ApiProperty()
  id!: number;

  @Expose()
  @ApiProperty({ description: '帳號類型', enum: AccountType })
  type!: AccountType;

  @Expose()
  @ApiProperty({ description: '帳號' })
  account!: string;

  @Expose()
  @ApiProperty({ description: '建立時間' })
  createdAt!: Date;

  @Expose()
  @ApiProperty({ description: '最後登入時間' })
  lastLoginAt?: Date;
}
