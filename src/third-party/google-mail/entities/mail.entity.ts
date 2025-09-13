import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class SendMailLogEntity {
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
  @ApiProperty({ description: '收件者' })
  to!: string;

  @Expose()
  @ApiProperty({ description: '建立時間' })
  createdAt!: Date;
}
