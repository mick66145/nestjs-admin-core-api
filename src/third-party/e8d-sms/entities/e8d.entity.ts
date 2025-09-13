import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class SendSmsLogEntity {
  @Expose()
  @ApiProperty()
  id!: number;

  @Expose()
  @ApiProperty()
  userAccountId!: number;

  @Expose()
  @ApiProperty({ description: '簡訊主旨' })
  subject!: string;

  @Expose()
  @ApiProperty({ description: '發送目標' })
  destination!: string;

  @Expose()
  @ApiProperty({ description: '預約時間' })
  sendTime!: string;

  @Expose()
  @ApiProperty({ description: '發送結果' })
  result!: string;

  @Expose()
  @ApiProperty({ description: '建立時間' })
  createdAt!: Date;
}
