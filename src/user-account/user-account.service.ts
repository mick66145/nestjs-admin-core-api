import { HttpStatus, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/_libs/prisma/prisma.service';
import { abortIf } from 'src/_libs/api-response/abort.util';
import { dealWithPrismaClientError } from 'src/libs/prisma/client-error';
import { AccountType, entityName } from './user-account.interface';
import { UserAccountEntity } from './entities/user-account.entity';
import { FindAllQueryDto } from './dto/find-all-query.dto';
import {
  CreateUserAccountDto,
  LoginDto,
  ResetPasswordDto,
  UpdatePasswordDto,
} from './dto/user-account.dto';

const loginErrMsg = '帳號或密碼錯誤';

@Injectable()
export class UserAccountService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserAccountDto) {
    try {
      const { account, password: rawPw } = dto;
      const password = await bcrypt.hash(rawPw, 10);
      const userAccount = await this.prisma.userAccount.create({
        data: { type: AccountType.Local, account, password },
      });
      return plainToInstance(UserAccountEntity, userAccount);
    } catch (err) {
      dealWithPrismaClientError(err, entityName);
      throw err;
    }
  }

  async login(dto: LoginDto) {
    const { account, password } = dto;
    let userAccount = await this.prisma.userAccount.findFirst({
      where: { account, type: AccountType.Local },
    });
    abortIf(!userAccount, loginErrMsg, HttpStatus.UNAUTHORIZED);

    const valid = await bcrypt.compare(password, userAccount!.password);
    abortIf(!valid, loginErrMsg, HttpStatus.UNAUTHORIZED);

    userAccount = await this.prisma.userAccount.update({
      where: { id: userAccount!.id },
      data: { lastLoginAt: new Date() },
    });
    return plainToInstance(UserAccountEntity, userAccount);
  }

  async updatePassword(id: number, dto: UpdatePasswordDto) {
    let userAccount = await this.prisma.userAccount.findFirst({
      where: { id },
    });
    abortIf(!userAccount, `無此${entityName}`, HttpStatus.NOT_FOUND);

    const { oldPassword, newPassword } = dto;
    const valid = await bcrypt.compare(oldPassword, userAccount!.password);
    abortIf(!valid, '舊密碼錯誤', HttpStatus.UNAUTHORIZED);

    const password = await bcrypt.hash(newPassword, 10);
    userAccount = await this.prisma.userAccount.update({
      where: { id: userAccount!.id },
      data: { password },
    });
    return plainToInstance(UserAccountEntity, userAccount);
  }

  async resetPassword(id: number, dto: ResetPasswordDto) {
    let userAccount = await this.prisma.userAccount.findFirst({
      where: { id },
    });
    abortIf(!userAccount, `無此${entityName}`, HttpStatus.NOT_FOUND);

    const { newPassword } = dto;
    const password = await bcrypt.hash(newPassword, 10);
    userAccount = await this.prisma.userAccount.update({
      where: { id: userAccount!.id },
      data: { password },
    });
    return plainToInstance(UserAccountEntity, userAccount);
  }

  async findAll(query: FindAllQueryDto) {
    const { page, limit, ids } = query;
    const where: Prisma.UserAccountWhereInput = {};
    if (ids?.length) where.id = { in: ids };

    const { result, ...meta } = await this.prisma.userAccount.pagination({
      page,
      limit,
      where,
      orderBy: { id: 'asc' },
    });
    return {
      data: plainToInstance(UserAccountEntity, result),
      meta,
    };
  }

  async findOne(id: number) {
    const userAccount = await this.prisma.userAccount.findFirst({
      where: { id },
    });
    abortIf(!userAccount, `無此${entityName}`, HttpStatus.NOT_FOUND);
    return plainToInstance(UserAccountEntity, userAccount);
  }

  async remove(id: number) {
    try {
      return await this.prisma.userAccount.delete({
        where: { id },
      });
    } catch (err) {
      dealWithPrismaClientError(err, entityName);
      throw err;
    }
  }

  async findByAccount(account: string) {
    const userAccount = await this.prisma.userAccount.findFirst({
      where: { account },
    });
    abortIf(!userAccount, `無此${entityName}`, HttpStatus.NOT_FOUND);
    return plainToInstance(UserAccountEntity, userAccount);
  }

  async existsByAccount(account: string) {
    const isExists = await this.prisma.userAccount.findFirst({
      where: { account },
    });
    return isExists !== null;
  }
}
