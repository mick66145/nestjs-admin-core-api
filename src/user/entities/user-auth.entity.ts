import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserAuthEntity {
  @ApiProperty({ example: 1704038400 })
  @Expose()
  iat!: number;

  @ApiProperty({ example: 1704038400 })
  @Expose()
  exp!: number;

  @ApiProperty({ example: 1704038400 })
  @Expose()
  refreshExp!: number;

  @ApiProperty({ example: 'token' })
  @Expose()
  token!: string;
}
