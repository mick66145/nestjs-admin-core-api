import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class TokenEntity {
  @ApiProperty({ description: '生成時間' })
  @Expose()
  iat!: number;

  @ApiProperty({ description: '過期時間' })
  @Expose()
  exp!: number;

  @ApiProperty({ description: '刷新過期時間(0為無期限)' })
  @Expose()
  refreshExp!: number;

  @ApiProperty({ example: 'token' })
  @Expose()
  token!: string;
}
