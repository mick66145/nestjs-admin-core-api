import { PartialType } from '@nestjs/swagger';
import { CreateUserAccountDto } from './user-account.dto';

export class UpdateUserAccountDto extends PartialType(CreateUserAccountDto) {}
