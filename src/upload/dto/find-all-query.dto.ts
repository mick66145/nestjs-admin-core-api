import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsDate, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from 'src/_libs/api-request/query.dto';

export class FindAllQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    type: String,
    description: 'uuid，以","分隔的字串',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value.split(',')), {
    toClassOnly: true,
  })
  uuids?: string[];

  @ApiPropertyOptional({ description: '開始時間' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startAt?: Date;

  @ApiPropertyOptional({ description: '結束時間' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endAt?: Date;
}
