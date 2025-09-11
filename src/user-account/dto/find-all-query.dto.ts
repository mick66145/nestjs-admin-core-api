import { PaginationQueryDto } from 'src/_libs/api-request/query.dto';
import { IntIdsQuery } from 'src/_libs/api-request/query.decorator';
import { entityName } from '../user-account.interface';

export class FindAllQueryDto extends PaginationQueryDto {
  @IntIdsQuery(entityName)
  ids?: number[];
}
