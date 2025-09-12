import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { IntIdsQuery } from 'src/_libs/api-request/query.decorator';
import { PaginationQueryDto } from 'src/_libs/api-request/query.dto';
import { TransformEmptyStringToUndefined } from 'src/_libs/transform/transform-to';

export class FindAllQueryDto extends PaginationQueryDto {
  @IntIdsQuery('總後台管理員')
  ids?: number[];

  @IntIdsQuery('角色')
  roleIds?: number[];

  @ApiPropertyOptional({ description: '關鍵字(名稱、帳號、Email、手機號碼)' })
  @IsOptional()
  @IsString()
  @TransformEmptyStringToUndefined({ toClassOnly: true })
  keyword?: string;
}
