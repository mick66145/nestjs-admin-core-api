import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { ApiSchema } from 'src/_libs/swagger/api-schema';
import { AccountType } from 'src/user-account/user-account.interface';

// lodash
import head from 'lodash/head';

@ApiSchema({ prefix: 'UserEntity.UserEntity' })
@Exclude()
export class RoleEntity {
  @ApiProperty({ example: 1 })
  @Expose()
  id!: number;

  @ApiProperty({ example: '角色名稱' })
  @Expose()
  name!: string;
}

@ApiSchema({ prefix: 'UserEntity.UserEntity' })
@Exclude()
export class UserAccountHasRoleEntity {
  @Expose({ toClassOnly: true })
  @Type(() => RoleEntity)
  role!: RoleEntity;
}

@ApiSchema({ prefix: 'UserEntity' })
@Exclude()
export class UserAccountEntity {
  @ApiProperty({ example: 1 })
  @Expose()
  id!: number;

  @ApiProperty({ example: 'account' })
  @Expose()
  account!: string;

  @ApiProperty({ enum: AccountType })
  @Expose()
  type!: AccountType;

  @ApiProperty({ type: 'string', format: 'date-time' })
  @Expose()
  lastLoginAt!: Date | null;

  @Expose({ toClassOnly: true })
  @Type(() => UserAccountHasRoleEntity)
  userAccountHasRole!: UserAccountHasRoleEntity[];
}

@Exclude()
export class UserEntity {
  @ApiProperty()
  @Expose()
  createdAt!: Date;

  @ApiProperty()
  @Expose()
  updatedAt!: Date;

  @ApiProperty({ description: '總後台管理員名稱', example: '總後台管理員名稱' })
  @Expose()
  name!: string;

  @ApiProperty({ description: '手機', example: '0912345678' })
  @Expose()
  phone!: string | null;

  @ApiProperty({ description: 'Email', example: 'example@mail.com' })
  @Expose()
  email!: string | null;

  @ApiProperty({ description: '是否已驗證' })
  @Expose()
  isValid!: boolean;

  @ApiProperty({ description: '是否已啟用' })
  @Expose()
  isEnabled!: boolean;

  @ApiProperty({ description: '是否為根帳號' })
  @Expose()
  isRoot!: boolean;

  @ApiProperty({ type: UserAccountEntity })
  @Expose()
  @Type(() => UserAccountEntity)
  userAccount!: UserAccountEntity;

  @ApiProperty({ type: RoleEntity })
  @Expose()
  role() {
    return head(this.userAccount.userAccountHasRole)?.role ?? null;
  }
}
