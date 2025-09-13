import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive } from 'class-validator';
import { PaginationQueryDto } from 'src/_libs/api-request/query.dto';
import { IntIdsQuery } from 'src/_libs/api-request/query.decorator';
import { entityName } from '../google-mail.interface';

export class FindAllQueryDto extends PaginationQueryDto {
  @IntIdsQuery(entityName)
  ids?: number[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  userAccountId?: number;
}
